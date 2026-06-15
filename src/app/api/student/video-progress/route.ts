// app/api/student/video-progress/route.ts
// Tracks per-video watch progress. Counts a "view" after 50 seconds watched.
// Also stores lastPosition for accurate resume.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, watchedPercentage, watchedSeconds, lastPosition, completed } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const existing = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId: session.user.id, videoId } },
    });

    const shouldCountView = (watchedSeconds ?? 0) >= 50 && !existing?.viewCounted;
    const accumulatedSeconds = (existing?.watchedSeconds ?? 0) + (watchedSeconds ?? 0);

    const progress = await prisma.videoProgress.upsert({
      where: { userId_videoId: { userId: session.user.id, videoId } },
      update: {
        watchedPercentage: watchedPercentage ?? existing?.watchedPercentage ?? 0,
        watchedSeconds: accumulatedSeconds,
        lastPosition: lastPosition ?? existing?.lastPosition ?? 0,
        completed: completed ?? existing?.completed ?? false,
        viewCounted: existing?.viewCounted || shouldCountView,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        videoId,
        watchedPercentage: watchedPercentage ?? 0,
        watchedSeconds: watchedSeconds ?? 0,
        lastPosition: lastPosition ?? 0,
        completed: completed ?? false,
        viewCounted: shouldCountView,
        bookmarked: false,
      },
    });

    if (shouldCountView) {
      await prisma.video.update({ where: { id: videoId }, data: { views: { increment: 1 } } });
    }

    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    console.error('Progress POST error:', err);
    return NextResponse.json({ error: 'Failed to track progress' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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