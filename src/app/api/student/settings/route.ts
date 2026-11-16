// GET /api/student/settings  -> { grade, dailyGoalMinutes }
// PUT /api/student/settings  -> update either (both optional)
//
// `grade` decides which live classes show up as "Upcoming" on the dashboard
// (e.g. "Class 10", "Class 12 (Science)", "JEE"); `dailyGoalMinutes` is the target of the goal ring.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";

async function ensureStudent(userId: string, role: string) {
  const existing = await prisma.student.findUnique({ where: { userId }, select: { id: true, grade: true, dailyGoalMinutes: true } });
  if (existing || role !== "TEACHER") return existing;
  // teachers can open the student screens; give them a profile on first use (same as the other student routes)
  return prisma.student.create({ data: { userId }, select: { id: true, grade: true, dailyGoalMinutes: true } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const student = await ensureStudent(session.user.id, session.user.role);
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    return NextResponse.json({ success: true, grade: student.grade, dailyGoalMinutes: student.dailyGoalMinutes });
  } catch (err) {
    console.error("[student/settings GET]", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const student = await ensureStudent(session.user.id, session.user.role);
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const data: { grade?: string | null; dailyGoalMinutes?: number } = {};

    if ("grade" in body) {
      const grade = body.grade === null || body.grade === "" ? null : String(body.grade).trim().slice(0, 40);
      data.grade = grade;
    }
    if ("dailyGoalMinutes" in body) {
      const n = Number(body.dailyGoalMinutes);
      if (!Number.isFinite(n) || n < 15 || n > 720) {
        return NextResponse.json({ error: "Daily goal must be between 15 minutes and 12 hours" }, { status: 400 });
      }
      data.dailyGoalMinutes = Math.round(n);
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data,
      select: { grade: true, dailyGoalMinutes: true },
    });
    return NextResponse.json({ success: true, ...updated });
  } catch (err) {
    console.error("[student/settings PUT]", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
