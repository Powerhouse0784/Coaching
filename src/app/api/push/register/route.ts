// /api/push/register — the app tells the server which phone should get notifications for this account.
//   POST   { token, platform? }   save / move the token to the signed-in user
//   DELETE { token }              sign-out: stop notifying this phone for this account
//   PATCH  { token, chatMuted }   mute / unmute Teacher Chat notifications on this phone
//   GET    ?token=...             current mute state

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/getSessionUser';
import { rateLimit } from '@/lib/rate-limit';
import { isExpoPushToken } from '@/lib/push';

async function me(req: NextRequest) {
  const session = await getSessionUser(req);
  return session?.user?.id ? (session.user as { id: string; role: string }) : null;
}
const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: NextRequest) {
  try {
    const user = await me(req);
    if (!user) return bad('Not signed in', 401);
    const rl = await rateLimit({ limit: 20, window: 60, identifier: `push-register:${user.id}` });
    if (!rl.success) return bad('Too many requests', 429);
    const body = await req.json().catch(() => null);
    if (!isExpoPushToken(body?.token)) return bad('Invalid push token');
    const platform = typeof body?.platform === 'string' ? body.platform.slice(0, 20) : null;
    // the same phone can sign into another account later: the token then moves to that account
    const row = await prisma.pushToken.upsert({
      where: { token: body.token },
      create: { token: body.token, userId: user.id, platform },
      update: { userId: user.id, platform },
      select: { chatMuted: true },
    });
    return NextResponse.json({ success: true, chatMuted: row.chatMuted });
  } catch (e) {
    console.error('push register failed', e);
    return bad('Failed to save push token', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await me(req);
    if (!user) return bad('Not signed in', 401);
    const body = await req.json().catch(() => null);
    if (!isExpoPushToken(body?.token)) return bad('Invalid push token');
    await prisma.pushToken.deleteMany({ where: { token: body.token, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('push unregister failed', e);
    return bad('Failed to remove push token', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await me(req);
    if (!user) return bad('Not signed in', 401);
    const body = await req.json().catch(() => null);
    if (!isExpoPushToken(body?.token) || typeof body?.chatMuted !== 'boolean') return bad('token and chatMuted (true/false) required');
    const r = await prisma.pushToken.updateMany({ where: { token: body.token, userId: user.id }, data: { chatMuted: body.chatMuted } });
    if (r.count === 0) return bad('Token not registered for this account', 404);
    return NextResponse.json({ success: true, chatMuted: body.chatMuted });
  } catch (e) {
    console.error('push mute failed', e);
    return bad('Failed to update', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await me(req);
    if (!user) return bad('Not signed in', 401);
    const token = new URL(req.url).searchParams.get('token');
    if (!isExpoPushToken(token)) return bad('Invalid push token');
    const row = await prisma.pushToken.findFirst({ where: { token, userId: user.id }, select: { chatMuted: true } });
    return NextResponse.json({ success: true, registered: !!row, chatMuted: row?.chatMuted ?? false });
  } catch (e) {
    console.error('push status failed', e);
    return bad('Failed', 500);
  }
}
