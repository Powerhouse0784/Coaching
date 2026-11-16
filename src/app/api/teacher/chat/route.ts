// app/api/teacher/chat/route.ts
// Teacher Chat Room (group chat for teachers).
//
// What changed vs the old route:
//  - PUT had NO authentication and NO ownership check: anyone (even signed out) could rewrite any message. Fixed.
//  - GET: `limit` was unbounded (limit=1000000 dumped the table) -> clamped; added `before` cursor + `hasMore` so older
//    messages can be loaded; returns `updatedAt` (the app's "edited" label never worked) and `meta.teacherCount`.
//  - POST: content / file fields validated (length, http(s) file URLs only), rate limited.
//  - PATCH (mark read): no longer pushes the same reader twice into `readBy`.
//  - Wrong role = 403 (the app logs a user out on 401, so 401 is only for "not signed in").
//  - 500 responses no longer leak `error.message`.

import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/getSessionUser';
import { rateLimit } from '@/lib/rate-limit';
import { notifyTeacherChat } from '@/lib/push';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MAX_CONTENT = 4000;
const MAX_URL = 2048;
const MAX_MARK_READ = 200;

const SENDER_SELECT = { id: true, name: true, avatar: true } as const;

type Auth = { id: string; role: string } | NextResponse;

async function requireTeacher(req: NextRequest): Promise<Auth> {
  const session = await getSessionUser(req);
  if (!session?.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (session.user.role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });
  return { id: session.user.id, role: session.user.role };
}

const isHttpUrl = (v: unknown): v is string => {
  if (typeof v !== 'string' || v.length === 0 || v.length > MAX_URL) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

const optString = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim().slice(0, max) : null;

function toDto(msg: any, meId: string) {
  return {
    id: msg.id,
    content: msg.content,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    fileType: msg.fileType,
    fileSize: msg.fileSize,
    isRead: msg.isRead,
    readBy: msg.readBy ?? [],
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    sender: { id: msg.sender.id, name: msg.sender.name, avatar: msg.sender.avatar },
    isSelf: msg.senderId === meId,
  };
}

// GET /api/teacher/chat?limit=50&before=<ISO date>
export async function GET(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const parsed = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const limit = Math.min(Math.max(Number.isFinite(parsed) ? parsed : DEFAULT_LIMIT, 1), MAX_LIMIT);

    const beforeRaw = searchParams.get('before');
    let before: Date | null = null;
    if (beforeRaw) {
      before = new Date(beforeRaw);
      if (Number.isNaN(before.getTime())) return NextResponse.json({ error: 'Invalid "before" date' }, { status: 400 });
    }

    // one extra row tells us whether older messages exist
    const rows = await prisma.teacherChatMessage.findMany({
      where: before ? { createdAt: { lt: before } } : undefined,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: SENDER_SELECT } },
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse(); // oldest first

    // header count: only on the first page, one cheap COUNT
    // every active teacher (the header used to guess the count from whoever had posted); also powers the members sheet
    let meta: { teacherCount: number; teachers: { id: string; name: string | null; avatar: string | null }[] } | undefined;
    if (!before) {
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER', isActive: true },
        select: SENDER_SELECT,
        orderBy: { name: 'asc' },
        take: 200,
      });
      meta = { teacherCount: teachers.length, teachers };
    }

    return NextResponse.json({ success: true, messages: page.map((m: any) => toDto(m, auth.id)), hasMore, meta });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - send a message (text and/or one attachment)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth instanceof NextResponse) return auth;

    const rl = await rateLimit({ limit: 30, window: 60, identifier: `teacher-chat:${auth.id}` });
    if (!rl.success) return NextResponse.json({ error: 'You are sending messages too fast. Please wait a moment.' }, { status: 429 });

    const body = await req.json().catch(() => null);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (content.length > MAX_CONTENT) {
      return NextResponse.json({ error: `Message is too long (max ${MAX_CONTENT} characters)` }, { status: 400 });
    }

    let fileUrl: string | null = null;
    if (body?.fileUrl !== undefined && body?.fileUrl !== null && body?.fileUrl !== '') {
      if (!isHttpUrl(body.fileUrl)) return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
      fileUrl = body.fileUrl;
    }
    if (!content && !fileUrl) return NextResponse.json({ error: 'Message content or file required' }, { status: 400 });

    const message = await prisma.teacherChatMessage.create({
      data: {
        content,
        fileUrl,
        fileName: fileUrl ? optString(body.fileName, 255) : null,
        fileType: fileUrl ? optString(body.fileType, 20) : null,
        fileSize: fileUrl ? optString(body.fileSize, 32) : null,
        senderId: auth.id,
      },
      include: { sender: { select: SENDER_SELECT } },
    });

    // notify the other teachers. after(): runs once the reply is sent (the sender never waits for Expo);
    // outside Next's request scope (tests) it simply runs inline. A failing push never fails the message.
    const push = () => notifyTeacherChat({ senderId: auth.id, senderName: message.sender?.name ?? null, content, hasFile: !!fileUrl, messageId: message.id });
    try { after(push); } catch { await push(); }

    return NextResponse.json({ success: true, message: toDto(message, auth.id) }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// PUT - edit your own message
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => null);
    const messageId = body?.messageId;
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!messageId || typeof messageId !== 'string') return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    if (!content) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    if (content.length > MAX_CONTENT) {
      return NextResponse.json({ error: `Message is too long (max ${MAX_CONTENT} characters)` }, { status: 400 });
    }

    const existing = await prisma.teacherChatMessage.findFirst({ where: { id: messageId, senderId: auth.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'Message not found or not yours' }, { status: 404 });

    const updated = await prisma.teacherChatMessage.update({
      where: { id: messageId },
      data: { content },
      select: { id: true, content: true, updatedAt: true },
    });
    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error('Error editing chat message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// PATCH - mark messages as read by the signed-in teacher
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => null);
    const ids = body?.messageIds;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_MARK_READ || !ids.every((x: unknown) => typeof x === 'string')) {
      return NextResponse.json({ error: `messageIds must be 1-${MAX_MARK_READ} ids` }, { status: 400 });
    }

    await prisma.teacherChatMessage.updateMany({
      where: {
        id: { in: ids },
        senderId: { not: auth.id },           // never mark your own messages
        NOT: { readBy: { has: auth.id } },    // and never add the same reader twice
      },
      data: { isRead: true, readBy: { push: auth.id } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking chat messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}

// DELETE /api/teacher/chat?id=<messageId> - delete your own message
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth instanceof NextResponse) return auth;

    const messageId = new URL(req.url).searchParams.get('id');
    if (!messageId) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });

    const message = await prisma.teacherChatMessage.findFirst({ where: { id: messageId, senderId: auth.id }, select: { id: true } });
    if (!message) return NextResponse.json({ error: 'Message not found or not yours' }, { status: 404 });

    await prisma.teacherChatMessage.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
