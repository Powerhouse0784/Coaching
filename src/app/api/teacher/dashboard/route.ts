// GET /api/teacher/dashboard
// One round trip for the mobile teacher dashboard. The response matches the app's `TeacherDashboardData`.
//
//  stats.students     active STUDENT accounts; delta = growth over the last 30 days; spark = last 7 days (cumulative)
//  stats.notes        this teacher's published notes; delta = growth over 30 days
//  stats.assignments  this teacher's published assignments; delta = growth over 30 days
//  stats.doubts       unsolved doubts (all classes); delta = asked this week vs last week
//  engagement         % of students who studied (>= 1 min of watch time) in the last 7 days; delta vs the 7 days before;
//                     weekly[7] = Mon..Sun, % of students active that day (future days are 0)
//  recentActivity     newest doubts + submissions on this teacher's assignments
//  unreadNotifications  unsolved doubts (capped by the app at 9+)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { addDays, istDay, istWeekStart, timeAgo } from "@/lib/istTime";

export const dynamic = "force-dynamic";

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const DAY_MS = 86_400_000;

/** Growth in %, 0 when there is nothing to compare with yet. */
function growthPct(now: number, before: number): number {
  if (before > 0) return clamp(Math.round(((now - before) / before) * 100), -999, 999);
  return now > 0 ? 100 : 0;
}

/** Counts per day for the last 7 days (oldest first), from a list of dates. */
function dailyCounts(dates: Date[], today: Date): number[] {
  const out = new Array(7).fill(0);
  for (const d of dates) {
    const idx = 6 - Math.floor((today.getTime() + DAY_MS - d.getTime()) / DAY_MS);
    if (idx >= 0 && idx < 7) out[idx] += 1;
  }
  return out;
}

/** Turn "created on day X" counts into a running total ending at `total`. */
function cumulative(total: number, perDay: number[]): number[] {
  const out: number[] = new Array(7);
  let running = total;
  for (let i = 6; i >= 0; i--) {
    out[i] = Math.max(0, running);
    running -= perDay[i];
  }
  return out;
}

/** Optional sections must never take the whole dashboard down (e.g. watch_logs migration not applied yet). */
async function optional<T>(label: string, q: Promise<T>, fallback: T): Promise<T> {
  try {
    return await q;
  } catch (err) {
    console.error(`[teacher/dashboard] ${label} unavailable`, err);
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const today = istDay(now);
    const weekStart = istWeekStart(now);
    const prevWeekStart = addDays(weekStart, -7);
    const since7 = new Date(now.getTime() - 7 * DAY_MS);
    const since14 = new Date(now.getTime() - 14 * DAY_MS);
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const sinceSpark = new Date(today.getTime() - 6 * DAY_MS);

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    const teacherId = teacher?.id ?? null;
    const noTeacher = { id: "__none__" }; // matches nothing

    const studentWhere = { role: "STUDENT", isActive: true };
    const notesWhere = { teacherId: teacherId ?? noTeacher.id, isPublished: true };
    const assignWhere = { teacherId: teacherId ?? noTeacher.id, isPublished: true };

    const [
      studentTotal, studentsBefore30, studentSignups, studentIds,
      noteTotal, notesBefore30, noteDates,
      assignTotal, assignBefore30, assignDates,
      pendingDoubts, doubtDates, doubtsLast7, doubtsPrev7,
      logs, recentDoubts, recentSubmissions,
    ] = await Promise.all([
      prisma.user.count({ where: studentWhere }),
      prisma.user.count({ where: { ...studentWhere, createdAt: { lt: since30 } } }),
      prisma.user.findMany({ where: { ...studentWhere, createdAt: { gte: sinceSpark } }, select: { createdAt: true } }),
      prisma.user.findMany({ where: studentWhere, select: { id: true }, take: 5000 }),
      prisma.note.count({ where: notesWhere }),
      prisma.note.count({ where: { ...notesWhere, createdAt: { lt: since30 } } }),
      prisma.note.findMany({ where: { ...notesWhere, createdAt: { gte: sinceSpark } }, select: { createdAt: true } }),
      prisma.assignmentV2.count({ where: assignWhere }),
      prisma.assignmentV2.count({ where: { ...assignWhere, createdAt: { lt: since30 } } }),
      prisma.assignmentV2.findMany({ where: { ...assignWhere, createdAt: { gte: sinceSpark } }, select: { createdAt: true } }),
      prisma.doubt.count({ where: { isSolved: false } }),
      prisma.doubt.findMany({ where: { isSolved: false, createdAt: { gte: sinceSpark } }, select: { createdAt: true } }),
      prisma.doubt.count({ where: { createdAt: { gte: since7 } } }),
      prisma.doubt.count({ where: { createdAt: { gte: since14, lt: since7 } } }),
      optional("watchLog", prisma.watchLog.findMany({
        where: { day: { gte: prevWeekStart, lte: today }, seconds: { gte: 60 }, user: studentWhere },
        select: { userId: true, day: true },
      }), [] as { userId: string; day: Date }[]),
      prisma.doubt.findMany({
        orderBy: { createdAt: "desc" }, take: 5,
        select: { id: true, title: true, subject: true, class: true, createdAt: true },
      }),
      optional("submissions", prisma.assignmentSubmission.findMany({
        where: { assignment: { teacherId: teacherId ?? noTeacher.id } },
        orderBy: { submittedAt: "desc" }, take: 5,
        select: {
          id: true, submittedAt: true,
          assignment: { select: { title: true } },
          student: { select: { user: { select: { name: true } } } },
        },
      }), [] as any[]),
    ]);

    // ── engagement ────────────────────────────────────────────────────────────
    const total = studentTotal || studentIds.length;
    const activeByDay = new Map<number, Set<string>>();
    for (const l of logs) {
      const k = l.day.getTime();
      if (!activeByDay.has(k)) activeByDay.set(k, new Set());
      activeByDay.get(k)!.add(l.userId);
    }
    const pct = (n: number) => (total > 0 ? clamp(Math.round((n / total) * 100), 0, 100) : 0);

    const daysElapsed = Math.round((today.getTime() - weekStart.getTime()) / DAY_MS) + 1; // 1..7
    const weekly: number[] = [];
    for (let i = 0; i < 7; i++) {
      weekly.push(i < daysElapsed ? pct(activeByDay.get(addDays(weekStart, i).getTime())?.size ?? 0) : 0);
    }

    const distinctIn = (from: Date, toExclusive: Date) => {
      const ids = new Set<string>();
      for (const [k, set] of activeByDay) if (k >= from.getTime() && k < toExclusive.getTime()) set.forEach((id) => ids.add(id));
      return ids.size;
    };
    const last7Start = addDays(today, -6);
    const prev7Start = addDays(today, -13);
    const engagementNow = pct(distinctIn(last7Start, addDays(today, 1)));
    const engagementPrev = pct(distinctIn(prev7Start, last7Start));

    // ── recent activity ───────────────────────────────────────────────────────
    const activity = [
      ...recentDoubts.map((d) => ({
        id: `d-${d.id}`, kind: "doubt" as const, at: d.createdAt.getTime(), timeAgo: timeAgo(d.createdAt, now),
        title: `New doubt from ${d.class?.trim() || d.subject}`,
        subtitle: d.title,
      })),
      ...recentSubmissions.map((s) => ({
        id: `s-${s.id}`, kind: "submission" as const, at: s.submittedAt.getTime(), timeAgo: timeAgo(s.submittedAt, now),
        title: `Assignment submitted by ${s.student.user.name?.trim() || "a student"}`,
        subtitle: s.assignment.title,
      })),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, 5)
      .map(({ at: _at, ...rest }) => rest);

    return NextResponse.json(
      {
        stats: {
          students: {
            value: studentTotal,
            delta: growthPct(studentTotal, studentsBefore30),
            spark: cumulative(studentTotal, dailyCounts(studentSignups.map((s) => s.createdAt), today)),
          },
          notes: {
            value: noteTotal,
            delta: growthPct(noteTotal, notesBefore30),
            spark: cumulative(noteTotal, dailyCounts(noteDates.map((s) => s.createdAt), today)),
          },
          assignments: {
            value: assignTotal,
            delta: growthPct(assignTotal, assignBefore30),
            spark: cumulative(assignTotal, dailyCounts(assignDates.map((s) => s.createdAt), today)),
          },
          doubts: {
            value: pendingDoubts,
            delta: growthPct(doubtsLast7, doubtsPrev7),
            spark: dailyCounts(doubtDates.map((s) => s.createdAt), today),
          },
        },
        engagement: { percent: engagementNow, delta: engagementNow - engagementPrev, weekly },
        recentActivity: activity,
        unreadNotifications: pendingDoubts,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    console.error("[teacher/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
