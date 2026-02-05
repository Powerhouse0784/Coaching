// app/api/teacher/video-folders/route.ts
// ✅ COMPLETE UPDATED VERSION - Handles FormData for thumbnail uploads
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// GET - Fetch all folders for the logged-in teacher
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

    const folders = await prisma.videoFolder.findMany({
      where: { teacherId: teacher.id },
      include: {
        videos: {
          include: {
            progress: {
              select: {
                watchedPercentage: true,
                watchedSeconds: true,
                viewCounted: true,
                userId: true
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

    const transformedFolders = folders.map(folder => {
      // ✅ Calculate unique viewers (only those who have viewCounted = true)
      const uniqueViewers = new Set<string>();
      let totalWatchSeconds = 0;

      folder.videos.forEach(video => {
        video.progress.forEach(prog => {
          // Only count users who have watched for 50+ seconds
          if (prog.viewCounted) {
            uniqueViewers.add(prog.userId);
          }
          // Sum actual watched seconds
          totalWatchSeconds += prog.watchedSeconds;
        });
      });

      return {
        id: folder.id,
        name: folder.name,
        subject: folder.subject,
        class: folder.class,
        chapter: folder.chapter,
        description: folder.description || '',
        thumbnail: folder.thumbnail || '',
        isPublic: folder.isPublic,
        videoCount: folder._count.videos,
        totalDuration: calculateTotalDuration(folder.videos),
        totalViews: folder.videos.reduce((sum, v) => sum + v.views, 0),
        totalWatchTime: formatWatchTime(totalWatchSeconds),
        createdAt: folder.createdAt.toISOString(),
        videos: folder.videos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description || '',
          duration: video.duration,
          views: video.views,
          uniqueViewers: video.progress.filter(p => p.viewCounted).length,
          totalWatchTime: formatWatchTime(
            video.progress.reduce((sum, p) => sum + p.watchedSeconds, 0)
          ),
          uploadDate: video.uploadDate.toISOString(),
          thumbnail: video.thumbnail || '',
          videoUrl: video.videoUrl,
          size: video.size || '0 MB',
          quality: video.quality
        }))
      };
    });

    return NextResponse.json(transformedFolders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

// ✅ UPDATED: POST - Create folder with thumbnail (FormData)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can create folders' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const subject = formData.get('subject') as string;
    const classValue = formData.get('class') as string;
    const chapter = formData.get('chapter') as string;
    const description = formData.get('description') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const thumbnailFile = formData.get('thumbnailFile') as File | null;

    if (!name || !subject || !classValue || !chapter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ✅ Handle thumbnail upload
    let thumbnailUrl = '';
    if (thumbnailFile) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'folder-thumbnails');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const timestamp = Date.now();
      const sanitizedName = thumbnailFile.name.replace(/[^a-zA-Z0-9.\-]/g, '_').toLowerCase();
      const fileName = `${timestamp}_${sanitizedName}`;
      const filePath = path.join(uploadsDir, fileName);
      
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(filePath, buffer);
      
      thumbnailUrl = `/uploads/folder-thumbnails/${fileName}`;
    }

    const folder = await prisma.videoFolder.create({
      data: {
        name,
        subject,
        class: classValue,
        chapter,
        description: description || '',
        thumbnail: thumbnailUrl,
        isPublic,
        teacherId: teacher.id
      }
    });

    const transformedFolder = {
      id: folder.id,
      name: folder.name,
      subject: folder.subject,
      class: folder.class,
      chapter: folder.chapter,
      description: folder.description || '',
      thumbnail: folder.thumbnail || '',
      isPublic: folder.isPublic,
      videoCount: 0,
      totalDuration: '0h 0m',
      totalViews: 0,
      totalWatchTime: '0h 0m',
      createdAt: folder.createdAt.toISOString(),
      videos: []
    };

    return NextResponse.json(transformedFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

function calculateTotalDuration(videos: any[]): string {
  let totalSeconds = 0;
  
  videos.forEach(video => {
    const parts = video.duration.split(':');
    if (parts.length === 2) {
      totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      totalSeconds += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
  });

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  return `${hours}h ${minutes}m`;
}

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}