import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/getSessionUser";
import { prisma } from "@/lib/prisma";
import { getNationalHolidays } from "@/lib/holidays";

async function getTeacherId(session: any) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return teacher?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacherId = await getTeacherId(session);
    if (!teacherId) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

    const [sessions, customHolidays] = await Promise.all([
      prisma.scheduleSession.findMany({ where: { teacherId }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
      prisma.scheduleHoliday.findMany({ where: { teacherId }, orderBy: { date: "asc" } }),
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      customHolidays,
      nationalHolidays: getNationalHolidays(year),
    });
    
  } catch (error) {
    console.error("Schedule GET error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacherId = await getTeacherId(session);
    if (!teacherId) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const body = await req.json();

    if (body.type === "holiday") {
      const { title, date } = body;
      if (!title || !date) return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
      const holiday = await prisma.scheduleHoliday.create({
        data: { teacherId, title, date: new Date(date) },
      });
      return NextResponse.json({ success: true, holiday });
    }

    // default: session
    const { title, subject, class: className, date, startTime, endTime, color, notes } = body;
      if (!title || !subject || !className || !date || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }
      const created = await prisma.scheduleSession.create({
        data: { teacherId, title, subject, class: className, date: new Date(date), startTime, endTime, color: color || "#3b82f6", notes: notes || null },
      });
    return NextResponse.json({ success: true, session: created });
  } catch (error) {
    console.error("Schedule POST error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacherId = await getTeacherId(session);
    if (!teacherId) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const body = await req.json();
    const { id, title, subject, class: className, date, startTime, endTime, color, notes } = body;
    if (!id) return NextResponse.json({ error: "Session id required" }, { status: 400 });

    const existing = await prisma.scheduleSession.findUnique({ where: { id } });
    if (!existing || existing.teacherId !== teacherId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await prisma.scheduleSession.update({
      where: { id },
      data: { title, subject, class: className, date: date ? new Date(date) : undefined, startTime, endTime, color, notes },
    });
    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error("Schedule PUT error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacherId = await getTeacherId(session);
    if (!teacherId) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "session";
    if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });

    if (type === "holiday") {
      const existing = await prisma.scheduleHoliday.findUnique({ where: { id } });
      if (!existing || existing.teacherId !== teacherId) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.scheduleHoliday.delete({ where: { id } });
    } else {
      const existing = await prisma.scheduleSession.findUnique({ where: { id } });
      if (!existing || existing.teacherId !== teacherId) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.scheduleSession.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Schedule DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}