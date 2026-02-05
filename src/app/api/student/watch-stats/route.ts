// app/api/student/watch-stats/route.ts
// ✅ UPDATED: Calculates actual watch time from watchedSeconds field
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Get student's watch statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all progress records for this user
    const progressRecords = await prisma.videoProgress.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        watchedSeconds: true,
        completed: true
      }
    });

    // ✅ Calculate total watch time from actual watchedSeconds field
    const totalWatchSeconds = progressRecords.reduce((sum, progress) => {
      return sum + (progress.watchedSeconds || 0);
    }, 0);

    const watchTimeHours = Math.floor(totalWatchSeconds / 3600);
    const watchTimeMinutes = Math.floor((totalWatchSeconds % 3600) / 60);

    // Count completed videos
    const completedVideos = progressRecords.filter(p => p.completed).length;
    const totalStartedVideos = progressRecords.length;

    return NextResponse.json({
      watchTime: {
        hours: watchTimeHours,
        minutes: watchTimeMinutes,
        totalSeconds: totalWatchSeconds
      },
      completedVideos,
      totalStartedVideos,
      completionRate: totalStartedVideos > 0 
        ? Math.round((completedVideos / totalStartedVideos) * 100) 
        : 0
    });
  } catch (error) {
    console.error('Error fetching watch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}