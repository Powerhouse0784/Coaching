// /api/doubts — the Discussion Forum.
//
//  GET     list (all doubts, newest first, max 200)  |  ?id=<doubtId> one doubt with its replies (+1 view)
//  POST    ask a doubt (students)
//  PATCH   { doubtId, action: "upvote" | "solve" | "pin" | "accept", replyId? }
//  DELETE  ?id=<doubtId>  (owner or teacher)
//
// Rules worth knowing:
//  - Every signed-in user sees every doubt (open AND solved): solved doubts are the forum's knowledge base.
//  - Upvotes are self-healing: the counter is recomputed from the vote rows, so a double tap, a retry or two
//    phones at once can never leave it wrong or crash.
//  - "accept" marks the answer AND the doubt as solved; only the doubt's owner can accept, and the reply
//    must belong to that doubt.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const PRIORITIES = ["low", "normal", "high", "urgent"];
const LIMITS = { title: 120, description: 2000, subject: 60, className: 40, fileName: 160 };

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
const httpUrl = (v: unknown): string | null => {
  if (typeof v !== "string" || v.length > 2048) return null;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};
const isUniqueViolation = (e: any) => e?.code === "P2002";

function shapeReply(reply: any, userId: string) {
  return {
    id: reply.id,
    content: reply.content,
    imageUrl: reply.imageUrl,
    imageName: reply.imageName,
    pdfUrl: reply.pdfUrl,
    pdfName: reply.pdfName,
    isPinned: reply.isPinned,
    isAccepted: reply.isAccepted,
    upvotes: reply.upvotes,
    createdAt: reply.createdAt,
    user: { id: reply.user.id, name: reply.user.name, avatar: reply.user.avatar, role: reply.user.role },
    isMyReply: reply.userId === userId,
    hasUpvoted: (reply.upvotedBy?.length ?? 0) > 0,
  };
}

function shapeDoubt(doubt: any, userId: string, studentId: string | null, withReplies: boolean) {
  const { upvotedBy, _count, replies, student, ...rest } = doubt;
  return {
    ...rest,
    student: { id: student.user.id, name: student.user.name, avatar: student.user.avatar },
    isMyDoubt: studentId !== null && doubt.studentId === studentId,
    hasUpvoted: upvotedBy.length > 0,
    stats: { totalReplies: _count.replies, totalUpvotes: _count.upvotedBy },
    replies: withReplies ? replies.map((r: any) => shapeReply(r, userId)) : [],
  };
}

const include = (userId: string, withReplies: boolean) => ({
  student: { include: { user: { select: { id: true, name: true, avatar: true } } } },
  upvotedBy: { where: { userId }, select: { id: true } },
  _count: { select: { replies: true, upvotedBy: true } },
  ...(withReplies
    ? {
        replies: {
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
            upvotedBy: { where: { userId }, select: { id: true } },
          },
          orderBy: [{ isAccepted: "desc" }, { isPinned: "desc" }, { createdAt: "asc" }] as any,
        },
      }
    : {}),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    const studentId = student?.id ?? null;

    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const doubt = await prisma.doubt.findUnique({ where: { id }, include: include(userId, true) as any });
      if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

      // Count a view at most once per user per doubt per 30 minutes, and never the asker's own.
      if (!(studentId && (doubt as any).studentId === studentId)) {
        const rl = await rateLimit({ identifier: `doubt-view:${userId}:${id}`, limit: 1, window: 1800 });
        if (rl.success) {
          await prisma.doubt.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});
          (doubt as any).views += 1;
        }
      }
      return NextResponse.json(
        { success: true, doubt: shapeDoubt(doubt, userId, studentId, true) },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const doubts = await prisma.doubt.findMany({
      include: include(userId, true) as any,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(
      { success: true, doubts: doubts.map((d) => shapeDoubt(d, userId, studentId, true)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Error fetching doubts:", error);
    return NextResponse.json({ error: "Failed to fetch doubts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const student = await prisma.student.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const rl = await rateLimit({ identifier: `doubt-post:${session.user.id}`, limit: 10, window: 3600 });
    if (!rl.success) return NextResponse.json({ error: "You're asking too fast. Please try again in a while." }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const title = str(body.title, LIMITS.title);
    const description = str(body.description, LIMITS.description);
    const subject = str(body.subject, LIMITS.subject);
    if (!title || !description || !subject) {
      return NextResponse.json({ error: "Title, description, and subject are required" }, { status: 400 });
    }
    const priority = PRIORITIES.includes(body.priority) ? body.priority : "normal";

    const doubt = await prisma.doubt.create({
      data: {
        title,
        description,
        subject,
        class: str(body.class, LIMITS.className) || null,
        priority,
        imageUrl: httpUrl(body.imageUrl),
        imageName: str(body.imageName, LIMITS.fileName) || null,
        pdfUrl: httpUrl(body.pdfUrl),
        pdfName: str(body.pdfName, LIMITS.fileName) || null,
        studentId: student.id,
      },
      include: { student: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });
    return NextResponse.json({ success: true, doubt }, { status: 201 });
  } catch (error) {
    console.error("Error creating doubt:", error);
    return NextResponse.json({ error: "Failed to create doubt" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const rl = await rateLimit({ identifier: `doubt-patch:${userId}`, limit: 120, window: 60 });
    if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const doubtId = typeof body.doubtId === "string" ? body.doubtId : "";
    const action = body.action;
    const replyId = typeof body.replyId === "string" ? body.replyId : "";
    if (!doubtId) return NextResponse.json({ error: "Doubt ID required" }, { status: 400 });

    const doubt = await prisma.doubt.findUnique({ where: { id: doubtId }, select: { id: true, studentId: true, isSolved: true } });
    if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

    const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
    const isOwner = !!student && doubt.studentId === student.id;
    const isTeacher = session.user.role === "TEACHER" || session.user.role === "ADMIN";

    if (action === "upvote") {
      const existing = await prisma.doubtUpvote.findUnique({ where: { doubtId_userId: { doubtId, userId } } });
      if (existing) {
        await prisma.doubtUpvote.deleteMany({ where: { doubtId, userId } });
      } else {
        try {
          await prisma.doubtUpvote.create({ data: { doubtId, userId } });
        } catch (e) {
          if (!isUniqueViolation(e)) throw e; // two taps at once: the vote already exists, that's fine
        }
      }
      const upvotes = await prisma.doubtUpvote.count({ where: { doubtId } });
      await prisma.doubt.update({ where: { id: doubtId }, data: { upvotes } });
      const hasUpvoted = !!(await prisma.doubtUpvote.findUnique({ where: { doubtId_userId: { doubtId, userId } } }));
      return NextResponse.json({ success: true, action: hasUpvoted ? "added" : "removed", upvotes, hasUpvoted });
    }

    if (action === "solve") {
      if (!isOwner && !isTeacher) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      const updated = await prisma.doubt.update({
        where: { id: doubtId },
        data: { status: "solved", isSolved: true, solvedAt: new Date() },
      });
      return NextResponse.json({ success: true, doubt: updated });
    }

    if (action === "pin" || action === "accept") {
      if (!replyId) return NextResponse.json({ error: "Reply ID required" }, { status: 400 });
      const reply = await prisma.doubtReply.findUnique({ where: { id: replyId }, select: { id: true, doubtId: true, isPinned: true, isAccepted: true } });
      if (!reply || reply.doubtId !== doubtId) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

      if (action === "pin") {
        if (!isTeacher) return NextResponse.json({ error: "Only teachers can pin replies" }, { status: 403 });
        await prisma.doubtReply.updateMany({ where: { doubtId }, data: { isPinned: false } });
        const updated = reply.isPinned ? reply : await prisma.doubtReply.update({ where: { id: replyId }, data: { isPinned: true } });
        return NextResponse.json({ success: true, reply: updated });
      }

      if (!isOwner) return NextResponse.json({ error: "Only the doubt owner can accept an answer" }, { status: 403 });
      await prisma.doubtReply.updateMany({ where: { doubtId }, data: { isAccepted: false } });
      if (reply.isAccepted) return NextResponse.json({ success: true, reply: { ...reply, isAccepted: false } }); // tap again = undo
      const updated = await prisma.doubtReply.update({ where: { id: replyId }, data: { isAccepted: true } });
      await prisma.doubt.update({ where: { id: doubtId }, data: { status: "solved", isSolved: true, solvedAt: new Date() } });
      return NextResponse.json({ success: true, reply: updated, doubtSolved: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating doubt:", error);
    return NextResponse.json({ error: "Failed to update doubt" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doubtId = new URL(req.url).searchParams.get("id");
    if (!doubtId) return NextResponse.json({ error: "Doubt ID required" }, { status: 400 });

    const doubt = await prisma.doubt.findUnique({ where: { id: doubtId }, include: { student: true } });
    if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

    const isOwner = doubt.student.userId === session.user.id;
    const isTeacher = session.user.role === "TEACHER" || session.user.role === "ADMIN";
    if (!isOwner && !isTeacher) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.doubt.delete({ where: { id: doubtId } });
    return NextResponse.json({ success: true, message: "Doubt deleted successfully" });
  } catch (error) {
    console.error("Error deleting doubt:", error);
    return NextResponse.json({ error: "Failed to delete doubt" }, { status: 500 });
  }
}
