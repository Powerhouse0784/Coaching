// app/api/student/watch-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await prisma.videoProgress.findMany({
      where: { userId: session.user.id },
      select: { watchedSeconds: true, completed: true, bookmarked: true },
    });

    const totalSecs = records.reduce((s, r) => s + (r.watchedSeconds ?? 0), 0);
    const completed = records.filter(r => r.completed).length;
    const bookmarked = records.filter(r => r.bookmarked).length;

    return NextResponse.json({
      watchTime: {
        hours: Math.floor(totalSecs / 3600),
        minutes: Math.floor((totalSecs % 3600) / 60),
        totalSeconds: totalSecs,
      },
      completedVideos: completed,
      startedVideos: records.length,
      bookmarkedVideos: bookmarked,
      completionRate: records.length > 0 ? Math.round((completed / records.length) * 100) : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
