// app/api/teacher/videos/[id]/route.ts
// ✅ COMPLETE UPDATED VERSION - Handles FormData for thumbnail uploads
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// PATCH - Update a video
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can update videos' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { folder: true }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.folder.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only update videos in your own folders' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const thumbnailFile = formData.get('thumbnailFile') as File | null;

    const updateData: any = {};
    
    if (title !== null && title.trim() !== '') updateData.title = title;
    if (description !== null) updateData.description = description;
    
    // ✅ Handle thumbnail upload
    if (thumbnailFile) {
      const thumbnailsDir = path.join(process.cwd(), 'public', 'uploads', 'video-thumbnails');
      if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const sanitizedName = thumbnailFile.name.replace(/[^a-zA-Z0-9.\-]/g, '_').toLowerCase();
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = path.join(thumbnailsDir, fileName);
      
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(filePath, buffer);
      
      updateData.thumbnail = `/uploads/video-thumbnails/${fileName}`;
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: updateData,
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
      }
    });

    const formattedVideo = {
      id: updatedVideo.id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      duration: updatedVideo.duration,
      views: updatedVideo.views,
      uniqueViewers: updatedVideo.progress.filter(p => p.viewCounted).length,
      totalWatchTime: (() => {
        const totalSeconds = updatedVideo.progress.reduce((sum, p) => sum + p.watchedSeconds, 0);
        return `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`;
      })(),
      uploadDate: updatedVideo.uploadDate.toISOString(),
      thumbnail: updatedVideo.thumbnail,
      videoUrl: updatedVideo.videoUrl,
      size: updatedVideo.size,
      quality: updatedVideo.quality,
      folderName: updatedVideo.folder.name
    };

    return NextResponse.json(formattedVideo);

  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

// DELETE - Delete a video
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can delete videos' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      include: { folder: true }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.folder.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only delete videos from your own folders' }, { status: 403 });
    }

    await prisma.video.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}

// GET - Get a single video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
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
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });

      if (video.folder.teacherId !== teacher?.id) {
        return NextResponse.json({ error: 'You can only view videos in your own folders' }, { status: 403 });
      }
    }

    const formattedVideo = {
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
      folderName: video.folder.name
    };

    return NextResponse.json(formattedVideo);

  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}