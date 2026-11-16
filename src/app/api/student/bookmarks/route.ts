// app/api/student/bookmarks/route.ts
// Bookmark a video / list bookmarked videos.
// Uses getSessionUser so it works for the website (cookie) AND the mobile app (Bearer token).
// The old version used getServerSession only, so every call from the app was a 401.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/getSessionUser';

// POST { videoId, bookmarked } - sets (not toggles) the bookmark, so a retried request can never flip it back.
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json().catch(() => null);
    const videoId = body?.videoId;
    if (!videoId || typeof videoId !== 'string') return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    if (typeof body?.bookmarked !== 'boolean') return NextResponse.json({ error: 'bookmarked must be true or false' }, { status: 400 });
    const bookmarked: boolean = body.bookmarked;

    // a deleted / unknown video is a 404, not a foreign-key 500
    const video = await prisma.video.findUnique({ where: { id: videoId }, select: { id: true } });
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const progress = await prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: { bookmarked },
      create: { userId, videoId, bookmarked, watchedPercentage: 0, watchedSeconds: 0, completed: false, viewCounted: false },
      select: { bookmarked: true },
    });

    return NextResponse.json({ success: true, bookmarked: progress.bookmarked });
  } catch (error) {
    console.error('Error setting bookmark:', error);
    return NextResponse.json({ error: 'Failed to update bookmark' }, { status: 500 });
  }
}

// GET - all bookmarked videos of the signed-in student
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await prisma.videoProgress.findMany({
      where: { userId: session.user.id, bookmarked: true },
      include: { video: { include: { folder: { select: { name: true, subject: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      rows.map((p) => ({
        id: p.video.id,
        title: p.video.title,
        description: p.video.description || '',
        duration: p.video.duration,
        videoUrl: p.video.videoUrl,
        thumbnail: p.video.thumbnail || `https://img.youtube.com/vi/${p.video.videoUrl}/hqdefault.jpg`,
        folderName: p.video.folder.name,
        folderSubject: p.video.folder.subject,
        watchedPercentage: p.watchedPercentage,
        completed: p.completed,
      }))
    );
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}
