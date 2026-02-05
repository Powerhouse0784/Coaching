// app/api/teacher/videos/route.ts
// ✅ COMPLETE - Works on Vercel with Puter.js + UploadThing
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST - Upload a new video (receives Puter.js URL from client)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can upload videos' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // ✅ Expecting JSON with Puter.js video URL and UploadThing thumbnail URL
    const body = await request.json();
    const { 
      folderId, 
      title, 
      description, 
      duration, 
      videoUrl,      // ✅ Puter.js video URL
      thumbnailUrl,  // ✅ UploadThing thumbnail URL
      size,
      quality
    } = body;

    // Validate required fields
    if (!folderId || !title || !videoUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields: folderId, title, and videoUrl are required' 
      }, { status: 400 });
    }

    // Check if folder exists and belongs to teacher
    const folder = await prisma.videoFolder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.teacherId !== teacher.id) {
      return NextResponse.json({ 
        error: 'You can only add videos to your own folders' 
      }, { status: 403 });
    }

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: (description || '').trim(),
        duration: duration || '0:00',
        views: 0,
        videoUrl: videoUrl,        // ✅ Puter.js URL
        thumbnail: thumbnailUrl || '', // ✅ UploadThing URL
        size: size || '0 MB',
        quality: quality || '1080p',
        folderId: folderId
      },
      include: {
        folder: true,
        progress: true
      }
    });

    return NextResponse.json({
      id: video.id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      views: video.views,
      uniqueViewers: 0,
      totalWatchTime: '0h 0m',
      uploadDate: video.uploadDate.toISOString(),
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      size: video.size,
      quality: video.quality,
      folderName: video.folder.name,
      folderId: video.folderId
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ 
      error: 'Failed to upload video. Please try again.' 
    }, { status: 500 });
  }
}

// GET - Get all videos for the teacher
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can access this' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    const whereClause: any = {
      folder: {
        teacherId: teacher.id
      }
    };
    
    if (folderId) {
      whereClause.folderId = folderId;
      const folder = await prisma.videoFolder.findUnique({
        where: { id: folderId }
      });
      if (folder && folder.teacherId !== teacher.id) {
        return NextResponse.json({ 
          error: 'You can only access videos in your own folders' 
        }, { status: 403 });
      }
    }

    const videos = await prisma.video.findMany({
      where: whereClause,
      include: {
        folder: true,
        progress: {
          select: {
            watchedPercentage: true,
            watchedSeconds: true,
            viewCounted: true,
            userId: true
          }
        }
      },
      orderBy: { uploadDate: 'desc' }
    });

    const formattedVideos = videos.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      views: video.views,
      uniqueViewers: video.progress.filter(p => p.viewCounted).length,
      totalWatchTime: (() => {
        const totalSeconds = video.progress.reduce((sum, p) => sum + p.watchedSeconds, 0);
        return `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`;
      })(),
      uploadDate: video.uploadDate.toISOString(),
      thumbnail: video.thumbnail,
      videoUrl: video.videoUrl,
      size: video.size,
      quality: video.quality,
      folderName: video.folder.name,
      folderId: video.folderId
    }));

    return NextResponse.json(formattedVideos);

  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}