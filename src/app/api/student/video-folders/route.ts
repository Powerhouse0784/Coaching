// app/api/student/video-folders/route.ts
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

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const classParam = searchParams.get('class');

    const where: any = { isPublic: true };
    if (subject && subject !== 'all') where.subject = subject;
    if (classParam && classParam !== 'all') where.class = classParam;

    const folders = await prisma.videoFolder.findMany({
      where,
      include: {
        videos: {
          orderBy: [{ order: 'asc' }, { uploadDate: 'desc' }],
          include: {
            progress: {
              where: { userId: session.user.id },
              select: { watchedPercentage: true, completed: true, bookmarked: true, watchedSeconds: true, lastPosition: true },
            },
          },
        },
        teacher: { include: { user: { select: { name: true, avatar: true } } } },
        _count: { select: { videos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformed = folders.map(folder => {
      const videos = folder.videos.map(v => ({
        id: v.id,
        title: v.title,
        description: v.description ?? '',
        duration: v.duration,
        views: v.views,
        uploadDate: v.uploadDate.toISOString(),
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoUrl}/hqdefault.jpg`,
        videoUrl: v.videoUrl,
        order: v.order,
        watched: v.progress[0]?.completed ?? false,
        watchedPercentage: v.progress[0]?.watchedPercentage ?? 0,
        watchedSeconds: v.progress[0]?.watchedSeconds ?? 0,
        lastPosition: v.progress[0]?.lastPosition ?? 0,
        bookmarked: v.progress[0]?.bookmarked ?? false,
      }));

      const totalSecs = videos.reduce((s, v) => s + parseDurationToSecs(v.duration), 0);
      const completedCount = videos.filter(v => v.watched).length;
      const progress = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;
      const totalViews = folder.videos.reduce((s, v) => s + v.views, 0);

      return {
        id: folder.id,
        name: folder.name,
        subject: folder.subject,
        class: folder.class,
        chapter: folder.chapter,
        description: folder.description ?? '',
        thumbnail: folder.thumbnail || (videos[0]?.thumbnail ?? ''),
        videoCount: folder._count.videos,
        totalDuration: formatDuration(totalSecs),
        totalViews,
        teacher: folder.teacher.user.name ?? 'Teacher',
        teacherAvatar: folder.teacher.user.avatar ?? '',
        progress,
        completedCount,
        videos,
      };
    });

    return NextResponse.json(transformed);
  } catch (err: any) {
    console.error('Error fetching folders:', err);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}
