// GET /api/student/teachers
// Powers the app's Teacher Directory in one round trip: the teacher list plus the four header numbers.
// Everything is real data - nothing is estimated:
//   stats.total        active teacher accounts
//   stats.activeToday  teachers who are NOT on a holiday they marked in their schedule for today (IST day)
//   stats.thisMonth    teachers who joined in the current IST month
//   stats.allTime      every teacher account ever registered (including deactivated ones)
//   teacher.status     "away" if the teacher marked today as a holiday, otherwise "active"
//
// Privacy: students only see public profile fields. Email and location are included ONLY when the
// environment variable SHOW_TEACHER_CONTACT=true, because anyone can register as a student and
// teachers' login emails are personal data. Phone, date of birth and social links are never sent here.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from "@/lib/rate-limit";
import { addDays, istDay } from "@/lib/istTime";

export const dynamic = "force-dynamic";

const SHOW_CONTACT = process.env.SHOW_TEACHER_CONTACT === "true";

const SELECT = {
  id: true,
  name: true,
  avatar: true,
  bio: true,
  qualification: true,
  experience: true,
  subjects: true,
  specialization: true,
  teachingStyle: true,
  createdAt: true,
  ...(SHOW_CONTACT ? { email: true, location: true } : {}),
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await rateLimit({ limit: 60, window: 60, identifier: `student-teachers:${session.user.id}` });
    if (!rl.success) return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });

    const today = istDay();
    const tomorrow = addDays(today, 1);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    const [users, allTime, thisMonth, holidays] = await Promise.all([
      prisma.user.findMany({
        where: { role: "TEACHER", isActive: true },
        select: SELECT,
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "TEACHER", isActive: true, createdAt: { gte: monthStart } } }),
      prisma.scheduleHoliday.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        select: { teacher: { select: { userId: true } } },
      }),
    ]);

    const awayUserIds = new Set(holidays.map((h: { teacher: { userId: string } }) => h.teacher.userId));

    const teachers = users.map((u: any) => ({
      ...u,
      status: awayUserIds.has(u.id) ? "away" : "active",
    }));

    const away = teachers.filter((t: { status: string }) => t.status === "away").length;

    return NextResponse.json({
      success: true,
      teachers,
      stats: {
        total: teachers.length,
        activeToday: teachers.length - away,
        thisMonth,
        allTime,
      },
      contactVisible: SHOW_CONTACT,
    });
  } catch (error) {
    console.error("Teacher directory error:", error);
    return NextResponse.json({ error: "Failed to load teachers" }, { status: 500 });
  }
}
