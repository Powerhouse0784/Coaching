// app/api/teacher/videos/route.ts
// ✅ COMPLETE UPDATED VERSION - Receives duration from client, handles thumbnail uploads
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';

// POST - Upload a new video
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

    const formData = await request.formData();
    
    const folderId = formData.get('folderId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = formData.get('duration') as string; // ✅ NEW: Client sends extracted duration
    const videoFile = formData.get('videoFile') as File;
    const thumbnailFile = formData.get('thumbnailFile') as File | null;

    // Validate required fields
    if (!folderId || !title || !videoFile) {
      return NextResponse.json({ 
        error: 'Missing required fields: folderId, title, and videoFile are required' 
      }, { status: 400 });
    }

    // Check file size (limit to 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
    if (videoFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2GB' 
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

    // Create uploads directory if it doesn't exist
    const videosDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    const thumbnailsDir = path.join(process.cwd(), 'public', 'uploads', 'video-thumbnails');
    
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Sanitize filename
    const sanitizeFilename = (filename: string) => {
      return filename
        .replace(/[^a-zA-Z0-9.\-]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
    };

    const timestamp = Date.now();
    const sanitizedVideoName = sanitizeFilename(videoFile.name);
    const videoFileName = `${timestamp}_${sanitizedVideoName}`;
    const videoFilePath = path.join(videosDir, videoFileName);
    const videoUrl = `/uploads/videos/${videoFileName}`;

    // Save video file
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(videoFilePath, videoBuffer);

    // ✅ Handle thumbnail upload
    let thumbnailUrl = '';
    if (thumbnailFile) {
      const sanitizedThumbName = sanitizeFilename(thumbnailFile.name);
      const thumbFileName = `${timestamp}_${sanitizedThumbName}`;
      const thumbFilePath = path.join(thumbnailsDir, thumbFileName);
      const thumbBuffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(thumbFilePath, thumbBuffer);
      thumbnailUrl = `/uploads/video-thumbnails/${thumbFileName}`;
    }

    // ✅ Use duration sent from client (already extracted)
    const finalDuration = duration || '0:00';

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        title: title.trim(),
        description: (description || '').trim(),
        duration: finalDuration, // ✅ Use client-extracted duration
        views: 0,
        videoUrl: videoUrl,
        thumbnail: thumbnailUrl,
        size: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
        quality: '1080p',
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
      uniqueViewers: video.progress.filter(p => p.viewCounted).length, // ✅ Only count 50-sec viewers
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