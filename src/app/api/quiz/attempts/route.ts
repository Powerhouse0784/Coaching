// POST /api/quiz/attempts  -> save a finished quiz so it shows up in the dashboard stats.
// GET  /api/quiz/attempts  -> the signed-in user's last 20 attempts.
//
// Quiz questions are AI generated and not stored, so the score is reported by the client.
// It only feeds personal stats (never grading or payments), so we validate ranges, not truth.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from "@/lib/rate-limit";

const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN);

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limit = await rateLimit({ identifier: `quizattempt:${session.user.id}`, limit: 30, window: 3600 });
    if (!limit.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json();
    const category = typeof body.category === "string" ? body.category.slice(0, 80) : "";
    const title = typeof body.title === "string" ? body.title.slice(0, 120) : "";
    const correct = int(body.correct);
    const total = int(body.total);
    const score = int(body.score);
    const totalMarks = int(body.totalMarks);

    if (!category || !title || [correct, total, score, totalMarks].some(Number.isNaN)) {
      return NextResponse.json({ error: "category, title, correct, total, score and totalMarks are required" }, { status: 400 });
    }
    if (total < 1 || total > 30 || correct < 0 || correct > total || totalMarks < 1 || totalMarks > 120 || score < -total || score > totalMarks) {
      return NextResponse.json({ error: "Invalid quiz result" }, { status: 400 });
    }

    const attempt = await prisma.quizAttempt.create({
      data: { userId: session.user.id, category, title, correct, total, score, totalMarks },
    });
    return NextResponse.json({ success: true, attempt }, { status: 201 });
  } catch (err) {
    console.error("[quiz/attempts POST]", err);
    return NextResponse.json({ error: "Failed to save quiz result" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, attempts });
  } catch (err) {
    console.error("[quiz/attempts GET]", err);
    return NextResponse.json({ error: "Failed to load attempts" }, { status: 500 });
  }
}
