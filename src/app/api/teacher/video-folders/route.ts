// app/api/teacher/video-folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function parseDurationToSecs(dur: string): number {
  const parts = (dur || '0:00').split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    const folders = await prisma.videoFolder.findMany({
      where: { teacherId: teacher.id },
      include: {
        videos: {
          orderBy: [{ order: 'asc' }, { uploadDate: 'desc' }],
          include: {
            progress: {
              select: { watchedPercentage: true, watchedSeconds: true, viewCounted: true, userId: true },
            },
          },
        },
        _count: { select: { videos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = folders.map(folder => {
      const totalSecs = folder.videos.reduce((s, v) => s + parseDurationToSecs(v.duration), 0);
      const totalViews = folder.videos.reduce((s, v) => s + v.views, 0);
      const totalWatchSecs = folder.videos.reduce((s, v) => s + v.progress.reduce((ps, p) => ps + p.watchedSeconds, 0), 0);

      return {
        id: folder.id,
        name: folder.name,
        subject: folder.subject,
        class: folder.class,
        chapter: folder.chapter,
        description: folder.description ?? '',
        thumbnail: folder.thumbnail ?? '',
        isPublic: folder.isPublic,
        youtubePlaylistId: folder.youtubePlaylistId,
        videoCount: folder._count.videos,
        totalDuration: formatDuration(totalSecs),
        totalViews,
        totalWatchTime: formatDuration(totalWatchSecs),
        createdAt: folder.createdAt.toISOString(),
        videos: folder.videos.map(v => ({
          id: v.id,
          title: v.title,
          description: v.description ?? '',
          duration: v.duration,
          views: v.views,
          uniqueViewers: v.progress.filter(p => p.viewCounted).length,
          totalWatchTime: formatDuration(v.progress.reduce((s, p) => s + p.watchedSeconds, 0)),
          uploadDate: v.uploadDate.toISOString(),
          thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoUrl}/hqdefault.jpg`,
          videoUrl: v.videoUrl,
          size: v.size ?? '0 MB',
          quality: v.quality,
        })),
      };
    });

    return NextResponse.json(transformed);
  } catch (err: any) {
    console.error('Error fetching folders:', err);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') return NextResponse.json({ error: 'Teachers only' }, { status: 403 });

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    const body = await request.json();
    const { name, subject, class: classValue, chapter, description, isPublic, thumbnailUrl } = body;
    if (!name || !subject || !classValue || !chapter) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const folder = await prisma.videoFolder.create({
      data: { name, subject, class: classValue, chapter, description: description || '', thumbnail: thumbnailUrl || '', isPublic: isPublic ?? true, teacherId: teacher.id },
    });

    return NextResponse.json({ id: folder.id, name: folder.name, subject: folder.subject, class: folder.class, chapter: folder.chapter, description: folder.description ?? '', thumbnail: folder.thumbnail ?? '', isPublic: folder.isPublic, videoCount: 0, totalDuration: '0h 0m', totalViews: 0, totalWatchTime: '0h 0m', createdAt: folder.createdAt.toISOString(), videos: [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
