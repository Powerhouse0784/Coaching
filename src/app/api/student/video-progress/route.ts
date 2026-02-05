// app/api/student/video-progress/route.ts
// ✅ UPDATED: Handles watch time tracking, 50-second view counting, and progress updates
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST - Track student video progress
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { videoId, watchedPercentage, watchedSeconds, completed } = data;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Get existing progress to check if view has been counted
    const existingProgress = await prisma.videoProgress.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId
        }
      }
    });

    // ✅ Count view if watched for 50+ seconds and not already counted
    const shouldCountView = watchedSeconds >= 50 && !existingProgress?.viewCounted;
    
    // Update or create progress record
    const progress = await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId
        }
      },
      update: {
        watchedPercentage: watchedPercentage || 0,
        watchedSeconds: (existingProgress?.watchedSeconds || 0) + (watchedSeconds || 0), // ✅ Accumulate watch time
        completed: completed || false,
        viewCounted: existingProgress?.viewCounted || shouldCountView, // ✅ Mark view as counted
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        videoId: videoId,
        watchedPercentage: watchedPercentage || 0,
        watchedSeconds: watchedSeconds || 0,
        completed: completed || false,
        viewCounted: shouldCountView,
        bookmarked: false
      }
    });

    // ✅ Increment video views count if this is the first 50-second view
    if (shouldCountView) {
      await prisma.video.update({
        where: { id: videoId },
        data: {
          views: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress: {
        videoId: progress.videoId,
        watchedPercentage: progress.watchedPercentage,
        watchedSeconds: progress.watchedSeconds,
        completed: progress.completed,
        viewCounted: progress.viewCounted
      }
    });
  } catch (error) {
    console.error('Error tracking video progress:', error);
    return NextResponse.json({ error: 'Failed to track progress' }, { status: 500 });
  }
}

// GET - Get student's progress for a specific video
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const progress = await prisma.videoProgress.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId
        }
      }
    });

    if (!progress) {
      return NextResponse.json({
        videoId,
        watchedPercentage: 0,
        watchedSeconds: 0,
        completed: false,
        bookmarked: false,
        viewCounted: false
      });
    }

    return NextResponse.json({
      videoId: progress.videoId,
      watchedPercentage: progress.watchedPercentage,
      watchedSeconds: progress.watchedSeconds,
      completed: progress.completed,
      bookmarked: progress.bookmarked,
      viewCounted: progress.viewCounted
    });
  } catch (error) {
    console.error('Error fetching video progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}