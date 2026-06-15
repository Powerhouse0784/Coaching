// app/api/teacher/video-folders/[id]/route.ts
// ✅ UPDATED — No UploadThing. Thumbnails are plain URLs (YouTube CDN or
// any image URL the teacher pastes in). Deleting a folder cascades to its
// videos and progress records automatically via the Prisma schema's
// onDelete: Cascade — no external file cleanup needed.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function parseDurationToSecs(dur: string): number {
  const parts = (dur || '0:00').split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatFolder(folder: any) {
  const totalSecs = folder.videos.reduce((s: number, v: any) => s + parseDurationToSecs(v.duration), 0);
  const totalViews = folder.videos.reduce((s: number, v: any) => s + v.views, 0);
  const totalWatchSecs = folder.videos.reduce(
    (s: number, v: any) => s + v.progress.reduce((ps: number, p: any) => ps + p.watchedSeconds, 0),
    0
  );

  return {
    id: folder.id,
    name: folder.name,
    subject: folder.subject,
    class: folder.class,
    chapter: folder.chapter,
    description: folder.description ?? '',
    thumbnail: folder.thumbnail ?? '',
    isPublic: folder.isPublic,
    youtubePlaylistId: folder.youtubePlaylistId,
    videoCount: folder.videos.length,
    totalDuration: formatDuration(totalSecs),
    totalViews,
    totalWatchTime: formatDuration(totalWatchSecs),
    createdAt: folder.createdAt.toISOString(),
    videos: folder.videos.map((video: any) => ({
      id: video.id,
      title: video.title,
      description: video.description ?? '',
      duration: video.duration,
      views: video.views,
      uniqueViewers: video.progress.filter((p: any) => p.viewCounted).length,
      totalWatchTime: formatDuration(video.progress.reduce((sum: number, p: any) => sum + p.watchedSeconds, 0)),
      uploadDate: video.uploadDate.toISOString(),
      thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoUrl}/hqdefault.jpg`,
      videoUrl: video.videoUrl,
      size: video.size ?? '0 MB',
      quality: video.quality,
    })),
  };
}

const progressSelect = {
  select: { watchedPercentage: true, watchedSeconds: true, viewCounted: true, userId: true },
} as const;

// DELETE - Delete a folder and all its videos (cascade)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can delete folders' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    const { id } = await params;

    const folder = await prisma.videoFolder.findUnique({
      where: { id },
      include: { _count: { select: { videos: true } } },
    });

    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    if (folder.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only delete your own folders' }, { status: 403 });
    }

    const deletedVideos = folder._count.videos;

    // Cascade deletes Video rows + their VideoProgress rows (see schema.prisma)
    await prisma.videoFolder.delete({ where: { id } });

    return NextResponse.json({ message: 'Folder deleted successfully', deletedVideos });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}

// PATCH - Update folder fields (name, subject, class, chapter, description,
// isPublic, thumbnail URL, youtubePlaylistId)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if ((session.user as any).role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can update folders' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });

    const { id } = await params;

    const folder = await prisma.videoFolder.findUnique({ where: { id } });
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    if (folder.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only update your own folders' }, { status: 403 });
    }

    const body = await request.json();
    const { name, subject, class: classValue, chapter, description, isPublic, thumbnailUrl, youtubePlaylistId } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (classValue) updateData.class = classValue;
    if (chapter) updateData.chapter = chapter;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (thumbnailUrl !== undefined) updateData.thumbnail = thumbnailUrl;
    if (youtubePlaylistId !== undefined) updateData.youtubePlaylistId = youtubePlaylistId || null;

    const updatedFolder = await prisma.videoFolder.update({
      where: { id },
      data: updateData,
      include: {
        videos: {
          orderBy: [{ order: 'asc' }, { uploadDate: 'desc' }],
          include: { progress: progressSelect },
        },
      },
    });

    return NextResponse.json(formatFolder(updatedFolder));
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

// GET - Get a single folder
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const folder = await prisma.videoFolder.findUnique({
      where: { id },
      include: {
        videos: {
          orderBy: [{ order: 'asc' }, { uploadDate: 'desc' }],
          include: { progress: progressSelect },
        },
      },
    });

    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });

    if ((session.user as any).role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      if (folder.teacherId !== teacher?.id) {
        return NextResponse.json({ error: 'You can only view your own folders' }, { status: 403 });
      }
    } else if ((session.user as any).role === 'STUDENT') {
      if (!folder.isPublic) {
        return NextResponse.json({ error: 'This folder is private' }, { status: 403 });
      }
    }

    return NextResponse.json(formatFolder(folder));
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 });
  }
}