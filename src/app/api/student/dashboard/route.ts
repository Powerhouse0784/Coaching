// GET /api/student/dashboard
// One round trip for the mobile dashboard. The response matches the app's `DashboardData` type.
//
// How each number is defined (so the app and the numbers stay honest):
//  goal.doneMinutes        today's watch time (IST day) from watch_logs
//  goal.targetMinutes      student.dailyGoalMinutes (default 120)
//  overallProgress         completed videos / started videos, 0-100 (same as watch-stats.completionRate)
//  delta                   this week's watch time vs the same weekdays last week, in %
//  weekly[7]               Mon..Sun, % of the daily goal reached (future days are 0)
//  topicsLearned           completed videos
//  testsAttempted          quiz attempts
//  achievements            milestones earned (see computeAchievements)
//  upcomingClass           next/live ScheduleSession for the student's grade (all sessions if no grade set)
//  unreadNotifications     assignments due within 72h that the student has not submitted yet
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import {
  addDays, formatClock, istDay, istMinutesOfDay, istWeekStart, parseHHMM, relativeDayLabel, timeAgo,
} from "@/lib/istTime";

export const dynamic = "force-dynamic";

type ActivityKind = "quiz" | "lecture" | "assignment" | "doubt";
interface Activity { id: string; kind: ActivityKind; title: string; timeAgo: string; xp?: number; at: number }

const DEFAULT_GOAL_MINUTES = 120;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function classMatches(sessionClass: string, grade: string | null | undefined): boolean {
  if (!grade) return true;
  const a = norm(sessionClass);
  const b = norm(grade);
  if (!a || a === "all" || a === "all classes") return true;
  // "Class 11" should match "Class 11 (Science)" but "Class 1" must not match "Class 11".
  const token = (x: string) => new RegExp(`(^|[^0-9])${x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^0-9]|$)`);
  return token(b).test(a) || token(a).test(b);
}

function computeStreak(secondsByDay: Map<number, number>, today: Date): number {
  let streak = 0;
  let cursor = today;
  // Today may not have been studied yet; a streak is still alive if yesterday was.
  if ((secondsByDay.get(cursor.getTime()) ?? 0) < 60) cursor = addDays(cursor, -1);
  while ((secondsByDay.get(cursor.getTime()) ?? 0) >= 60) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computeAchievements(a: { completedVideos: number; quizzes: number; submissions: number; streak: number }): number {
  const rules = [
    a.completedVideos >= 1, a.completedVideos >= 10, a.completedVideos >= 25,
    a.quizzes >= 1, a.quizzes >= 10,
    a.submissions >= 1, a.submissions >= 5,
    a.streak >= 3, a.streak >= 7,
  ];
  return rules.filter(Boolean).length;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const now = new Date();
    const today = istDay(now);
    const weekStart = istWeekStart(now);
    const lastWeekStart = addDays(weekStart, -7);

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true, grade: true, dailyGoalMinutes: true },
    });
    const studentId = student?.id ?? null;
    const targetMinutes = student?.dailyGoalMinutes && student.dailyGoalMinutes > 0 ? student.dailyGoalMinutes : DEFAULT_GOAL_MINUTES;

    const [
      logs, startedVideos, completedVideos, quizCount, submissionCount, dueSoon, sessions,
      recentVideos, recentSubmissions, recentQuizzes, recentDoubts,
    ] = await Promise.all([
      prisma.watchLog.findMany({
        where: { userId, day: { gte: lastWeekStart, lte: today } },
        select: { day: true, seconds: true },
      }),
      prisma.videoProgress.count({ where: { userId } }),
      prisma.videoProgress.count({ where: { userId, completed: true } }),
      prisma.quizAttempt.count({ where: { userId } }),
      studentId ? prisma.assignmentSubmission.count({ where: { studentId } }) : Promise.resolve(0),
      studentId
        ? prisma.assignmentV2.count({
            where: {
              isPublished: true,
              dueDate: { gte: now, lte: new Date(now.getTime() + 72 * 3_600_000) },
              submissions: { none: { studentId } },
            },
          })
        : Promise.resolve(0),
      prisma.scheduleSession.findMany({
        where: { date: { gte: today, lte: addDays(today, 14) } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        take: 60,
        select: { id: true, subject: true, class: true, date: true, startTime: true, endTime: true },
      }),
      prisma.videoProgress.findMany({
        where: { userId }, orderBy: { updatedAt: "desc" }, take: 5,
        select: { id: true, completed: true, updatedAt: true, video: { select: { title: true } } },
      }),
      studentId
        ? prisma.assignmentSubmission.findMany({
            where: { studentId }, orderBy: { submittedAt: "desc" }, take: 5,
            select: { id: true, submittedAt: true, assignment: { select: { title: true } } },
          })
        : Promise.resolve([]),
      prisma.quizAttempt.findMany({
        where: { userId }, orderBy: { createdAt: "desc" }, take: 5,
        select: { id: true, title: true, correct: true, createdAt: true },
      }),
      studentId
        ? prisma.doubt.findMany({
            where: { studentId }, orderBy: { createdAt: "desc" }, take: 5,
            select: { id: true, title: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    // ── watch time ────────────────────────────────────────────────────────────
    const secondsByDay = new Map<number, number>(logs.map((l) => [l.day.getTime(), l.seconds]));
    const todaySeconds = secondsByDay.get(today.getTime()) ?? 0;

    const weekly: number[] = [];
    let thisWeekSeconds = 0;
    let lastWeekSeconds = 0;
    const daysElapsed = Math.round((today.getTime() - weekStart.getTime()) / 86_400_000) + 1; // 1..7
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const secs = i < daysElapsed ? secondsByDay.get(day.getTime()) ?? 0 : 0;
      if (i < daysElapsed) {
        thisWeekSeconds += secs;
        lastWeekSeconds += secondsByDay.get(addDays(lastWeekStart, i).getTime()) ?? 0;
      }
      weekly.push(clamp(Math.round((secs / 60 / targetMinutes) * 100), 0, 100));
    }
    const delta =
      lastWeekSeconds > 0
        ? clamp(Math.round(((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100), -999, 999)
        : thisWeekSeconds > 0 ? 100 : 0;

    // ── upcoming class ────────────────────────────────────────────────────────
    const nowMinutes = istMinutesOfDay(now);
    let upcomingClass: { id: string; subject: string; when: string; isLive: boolean } | null = null;
    for (const s of sessions) {
      if (!classMatches(s.class, student?.grade)) continue;
      const start = parseHHMM(s.startTime);
      const end = parseHHMM(s.endTime);
      if (start === null || end === null) continue;
      const isToday = s.date.getTime() === today.getTime();
      if (isToday && end <= nowMinutes) continue; // already over
      upcomingClass = {
        id: s.id,
        subject: s.subject,
        when: `${relativeDayLabel(s.date, today)} • ${formatClock(start)} – ${formatClock(end)}`,
        isLive: isToday && start <= nowMinutes && nowMinutes < end,
      };
      break;
    }

    // ── recent activity ───────────────────────────────────────────────────────
    const activity: Activity[] = [
      ...recentVideos.map((v): Activity => ({
        id: `v-${v.id}`, kind: "lecture", at: v.updatedAt.getTime(), timeAgo: timeAgo(v.updatedAt, now),
        title: `${v.completed ? "Completed" : "Viewed"}: ${v.video.title}`,
      })),
      ...recentSubmissions.map((s): Activity => ({
        id: `s-${s.id}`, kind: "assignment", at: s.submittedAt.getTime(), timeAgo: timeAgo(s.submittedAt, now),
        title: `Submitted: ${s.assignment.title}`,
      })),
      ...recentQuizzes.map((q): Activity => ({
        id: `q-${q.id}`, kind: "quiz", at: q.createdAt.getTime(), timeAgo: timeAgo(q.createdAt, now),
        title: `Completed: ${q.title}`, xp: q.correct * 5,
      })),
      ...recentDoubts.map((d): Activity => ({
        id: `d-${d.id}`, kind: "doubt", at: d.createdAt.getTime(), timeAgo: timeAgo(d.createdAt, now),
        title: `Asked: ${d.title}`,
      })),
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, 5);

    const streak = computeStreak(secondsByDay, today);

    return NextResponse.json(
      {
        goal: { doneMinutes: Math.floor(todaySeconds / 60), targetMinutes },
        performance: {
          overallProgress: startedVideos > 0 ? Math.round((completedVideos / startedVideos) * 100) : 0,
          delta,
          topicsLearned: completedVideos,
          testsAttempted: quizCount,
          achievements: computeAchievements({ completedVideos, quizzes: quizCount, submissions: submissionCount, streak }),
          weekly,
        },
        upcomingClass,
        recentActivity: activity.map(({ at: _at, ...rest }) => rest),
        unreadNotifications: dueSoon,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err) {
    console.error("[student/dashboard]", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
