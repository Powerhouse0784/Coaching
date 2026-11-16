// /api/doubts/reply
//  POST   { doubtId, content?, imageUrl?, pdfUrl?, ... }   add a reply (text and/or one attachment)
//  PATCH  { replyId }                                       like / unlike a reply (self-healing counter)
//  DELETE ?id=<replyId>                                     reply owner or teacher
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_CONTENT = 2000;
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

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await rateLimit({ identifier: `reply-post:${session.user.id}`, limit: 20, window: 600 });
    if (!rl.success) return NextResponse.json({ error: "You're replying too fast. Please wait a moment." }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const doubtId = typeof body.doubtId === "string" ? body.doubtId : "";
    const content = str(body.content, MAX_CONTENT);
    const imageUrl = httpUrl(body.imageUrl);
    const pdfUrl = httpUrl(body.pdfUrl);

    if (!doubtId) return NextResponse.json({ error: "Doubt ID is required" }, { status: 400 });
    // The app lets people send just a photo or PDF, so text is only required when there is no attachment.
    if (!content && !imageUrl && !pdfUrl) return NextResponse.json({ error: "Write something or attach a file" }, { status: 400 });

    const doubt = await prisma.doubt.findUnique({ where: { id: doubtId }, select: { id: true } });
    if (!doubt) return NextResponse.json({ error: "Doubt not found" }, { status: 404 });

    const reply = await prisma.doubtReply.create({
      data: {
        content,
        imageUrl,
        imageName: imageUrl ? str(body.imageName, 160) || null : null,
        pdfUrl,
        pdfName: pdfUrl ? str(body.pdfName, 160) || null : null,
        doubtId,
        userId: session.user.id,
      },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    });
    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const rl = await rateLimit({ identifier: `reply-like:${userId}`, limit: 120, window: 60 });
    if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await req.json().catch(() => ({}));
    const replyId = typeof body.replyId === "string" ? body.replyId : "";
    if (!replyId) return NextResponse.json({ error: "Reply ID required" }, { status: 400 });

    const reply = await prisma.doubtReply.findUnique({ where: { id: replyId }, select: { id: true } });
    if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

    const existing = await prisma.doubtReplyUpvote.findUnique({ where: { replyId_userId: { replyId, userId } } });
    if (existing) {
      await prisma.doubtReplyUpvote.deleteMany({ where: { replyId, userId } });
    } else {
      try {
        await prisma.doubtReplyUpvote.create({ data: { replyId, userId } });
      } catch (e: any) {
        if (e?.code !== "P2002") throw e; // two taps at once: the like already exists
      }
    }
    const upvotes = await prisma.doubtReplyUpvote.count({ where: { replyId } });
    await prisma.doubtReply.update({ where: { id: replyId }, data: { upvotes } });
    const hasUpvoted = !!(await prisma.doubtReplyUpvote.findUnique({ where: { replyId_userId: { replyId, userId } } }));
    return NextResponse.json({ success: true, action: hasUpvoted ? "added" : "removed", upvotes, hasUpvoted });
  } catch (error) {
    console.error("Error upvoting reply:", error);
    return NextResponse.json({ error: "Failed to upvote reply" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const replyId = new URL(req.url).searchParams.get("id");
    if (!replyId) return NextResponse.json({ error: "Reply ID required" }, { status: 400 });

    const reply = await prisma.doubtReply.findUnique({ where: { id: replyId } });
    if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

    const isOwner = reply.userId === session.user.id;
    const isTeacher = session.user.role === "TEACHER" || session.user.role === "ADMIN";
    if (!isOwner && !isTeacher) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    await prisma.doubtReply.delete({ where: { id: replyId } });
    return NextResponse.json({ success: true, message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 });
  }
}
