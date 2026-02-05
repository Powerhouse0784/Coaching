// app/api/student/bookmarks/route.ts
// ✅ No major changes needed - already working correctly
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST - Toggle bookmark on a video
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { videoId, bookmarked } = data;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Upsert progress record with bookmark status
    const progress = await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: videoId
        }
      },
      update: {
        bookmarked: bookmarked,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        videoId: videoId,
        bookmarked: bookmarked,
        watchedPercentage: 0,
        watchedSeconds: 0, // ✅ Initialize with 0
        completed: false,
        viewCounted: false // ✅ Initialize with false
      }
    });

    return NextResponse.json({
      success: true,
      bookmarked: progress.bookmarked
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle bookmark' }, { status: 500 });
  }
}

// GET - Get all bookmarked videos for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookmarkedProgress = await prisma.videoProgress.findMany({
      where: {
        userId: session.user.id,
        bookmarked: true
      },
      include: {
        video: {
          include: {
            folder: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      }
    });

    const bookmarkedVideos = bookmarkedProgress.map(progress => ({
      id: progress.video.id,
      title: progress.video.title,
      description: progress.video.description || '',
      duration: progress.video.duration,
      videoUrl: progress.video.videoUrl,
      thumbnail: progress.video.thumbnail || '', // ✅ Support thumbnails
      folderName: progress.video.folder.name,
      folderSubject: progress.video.folder.subject,
      watchedPercentage: progress.watchedPercentage,
      completed: progress.completed
    }));

    return NextResponse.json(bookmarkedVideos);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}