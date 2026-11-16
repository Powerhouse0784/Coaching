// app/api/student/watch-stats/route.ts
// "Started" used to count every progress row, and bookmarking a video creates one,
// so bookmarking alone inflated it. A video is started only when something was actually watched.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/getSessionUser';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const records = await prisma.videoProgress.findMany({
      where: { userId: session.user.id },
      select: { watchedSeconds: true, watchedPercentage: true, completed: true, bookmarked: true },
    });

    const totalSecs = records.reduce((s, r) => s + (r.watchedSeconds ?? 0), 0);
    const completed = records.filter((r) => r.completed).length;
    const bookmarked = records.filter((r) => r.bookmarked).length;
    const started = records.filter((r) => r.completed || (r.watchedSeconds ?? 0) > 0 || (r.watchedPercentage ?? 0) > 0).length;

    return NextResponse.json({
      watchTime: { hours: Math.floor(totalSecs / 3600), minutes: Math.floor((totalSecs % 3600) / 60), totalSeconds: totalSecs },
      completedVideos: completed,
      startedVideos: started,
      bookmarkedVideos: bookmarked,
      completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
    });
  } catch (err: any) {
    console.error('Watch stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
