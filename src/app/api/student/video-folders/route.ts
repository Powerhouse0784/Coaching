// app/api/student/video-folders/route.ts
// ✅ UPDATED: Fixed duration calculation and added thumbnail support
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all PUBLIC folders (accessible by students)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const classParam = searchParams.get('class');

    // Build where clause - ONLY show PUBLIC folders to students
    const where: any = {
      isPublic: true  // ✅ Students only see public folders
    };
    if (subject && subject !== 'all') {
      where.subject = subject;
    }
    if (classParam && classParam !== 'all') {
      where.class = classParam;
    }

    // Fetch all folders with videos and student progress
    const folders = await prisma.videoFolder.findMany({
      where,
      include: {
        videos: {
          include: {
            progress: {
              where: { userId: session.user.id },
              select: {
                watchedPercentage: true,
                completed: true,
                bookmarked: true,
                watchedSeconds: true
              }
            }
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: { videos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data
    const transformedFolders = folders.map(folder => {
      const videosWithProgress = folder.videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description || '',
        duration: video.duration,
        views: video.views,
        uploadDate: video.uploadDate.toISOString(),
        thumbnail: video.thumbnail || '', // ✅ Support uploaded thumbnails
        videoUrl: video.videoUrl,
        watched: video.progress[0]?.completed || false,
        watchedPercentage: video.progress[0]?.watchedPercentage || 0,
        bookmarked: video.progress[0]?.bookmarked || false
      }));

      // Calculate folder progress
      const totalVideos = videosWithProgress.length;
      const completedVideos = videosWithProgress.filter(v => v.watched).length;
      const progress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      return {
        id: folder.id,
        name: folder.name,
        subject: folder.subject,
        class: folder.class,
        chapter: folder.chapter,
        description: folder.description || '',
        thumbnail: folder.thumbnail || '', // ✅ Support uploaded thumbnails
        videoCount: folder._count.videos,
        totalDuration: calculateTotalDuration(folder.videos), // ✅ Accurate calculation
        totalViews: folder.videos.reduce((sum, v) => sum + v.views, 0),
        teacher: folder.teacher.user.name || 'Teacher',
        progress,
        videos: videosWithProgress
      };
    });

    return NextResponse.json(transformedFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

// ✅ FIXED: Accurate duration calculation
function calculateTotalDuration(videos: any[]): string {
  let totalSeconds = 0;
  
  videos.forEach(video => {
    const parts = video.duration.split(':');
    if (parts.length === 2) {
      // Format: MM:SS
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      totalSeconds += (mins * 60) + secs;
    } else if (parts.length === 3) {
      // Format: HH:MM:SS
      const hours = parseInt(parts[0]) || 0;
      const mins = parseInt(parts[1]) || 0;
      const secs = parseInt(parts[2]) || 0;
      totalSeconds += (hours * 3600) + (mins * 60) + secs;
    }
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  return `${hours}h ${minutes}m`;
}