// app/api/student/video-progress/route.ts
// Tracks per-video watch progress. Counts a "view" after 50 seconds watched.
// Also stores lastPosition for accurate resume and a per-day watch log for the dashboard.
//
// `watchedSeconds` in the request is the seconds watched SINCE THE LAST SYNC (a delta).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from "@/lib/getSessionUser";
import { istDay } from "@/lib/istTime";

// One sync can never legitimately carry more than this (clients sync every ~10s).
const MAX_SECONDS_PER_SYNC = 600;

const toInt = (v: unknown, lo: number, hi: number): number | undefined => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : undefined;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const { videoId } = body;
    if (!videoId || typeof videoId !== 'string') return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    // The app reports fractional values (e.g. 43.7%); the columns are integers.
    const watchedPercentage = toInt(body.watchedPercentage, 0, 100);
    const lastPosition = toInt(body.lastPosition, 0, 86_400);
    const deltaSeconds = toInt(body.watchedSeconds, 0, MAX_SECONDS_PER_SYNC) ?? 0;
    const completed = typeof body.completed === 'boolean' ? body.completed : undefined;

    const video = await prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const existing = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    const shouldCountView = deltaSeconds >= 50 && !existing?.viewCounted;

    const [progress] = await prisma.$transaction([
      prisma.videoProgress.upsert({
        where: { userId_videoId: { userId, videoId } },
        update: {
          watchedPercentage: watchedPercentage ?? existing?.watchedPercentage ?? 0,
          watchedSeconds: { increment: deltaSeconds },
          lastPosition: lastPosition ?? existing?.lastPosition ?? 0,
          // once a video is completed it stays completed (a later partial sync must not undo it)
          completed: (existing?.completed ?? false) || (completed ?? false),
          viewCounted: existing?.viewCounted || shouldCountView,
        },
        create: {
          userId,
          videoId,
          watchedPercentage: watchedPercentage ?? 0,
          watchedSeconds: deltaSeconds,
          lastPosition: lastPosition ?? 0,
          completed: completed ?? false,
          viewCounted: shouldCountView,
          bookmarked: false,
        },
      }),
      ...(deltaSeconds > 0
        ? [
            prisma.watchLog.upsert({
              where: { userId_day: { userId, day: istDay() } },
              update: { seconds: { increment: deltaSeconds } },
              create: { userId, day: istDay(), seconds: deltaSeconds },
            }),
          ]
        : []),
      ...(shouldCountView
        ? [prisma.video.update({ where: { id: videoId }, data: { views: { increment: 1 } } })]
        : []),
    ]);

    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    console.error('Progress POST error:', err);
    return NextResponse.json({ error: 'Failed to track progress' }, { status: 500 });
  }
}

// PATCH { videoId, completed } - the "Mark as Completed" switch. Unlike POST (which only ever sets completed),
// this can also turn it off. Idempotent: sending the same value twice changes nothing.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json().catch(() => null);
    const videoId = body?.videoId;
    if (!videoId || typeof videoId !== 'string') return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    if (typeof body?.completed !== 'boolean') return NextResponse.json({ error: 'completed must be true or false' }, { status: 400 });
    const completed: boolean = body.completed;

    const video = await prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const progress = await prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { completed },
      create: { userId, videoId, completed, watchedPercentage: completed ? 100 : 0, watchedSeconds: 0, lastPosition: 0, viewCounted: false, bookmarked: false },
    });

    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    console.error('Progress PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const videoId = new URL(request.url).searchParams.get('videoId');
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const progress = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId: session.user.id, videoId } },
    });

    return NextResponse.json(progress ?? {
      videoId, watchedPercentage: 0, watchedSeconds: 0, lastPosition: 0,
      completed: false, bookmarked: false, viewCounted: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
