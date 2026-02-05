// app/api/teacher/video-folders/[id]/route.ts
// ✅ COMPLETE - Works on Vercel with UploadThing
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// DELETE - Delete a folder
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
      return NextResponse.json({ error: 'Only teachers can delete folders' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { id } = await params;

    const folder = await prisma.videoFolder.findUnique({
      where: { id }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only delete your own folders' }, { status: 403 });
    }

    await prisma.videoFolder.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}

// PATCH - Update folder with thumbnail URL from UploadThing
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
      return NextResponse.json({ error: 'Only teachers can update folders' }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { id } = await params;

    const folder = await prisma.videoFolder.findUnique({
      where: { id }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'You can only update your own folders' }, { status: 403 });
    }

    // ✅ Expecting JSON with thumbnail URL from UploadThing
    const body = await request.json();
    const { name, subject, class: classValue, chapter, description, isPublic, thumbnailUrl } = body;

    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (subject) updateData.subject = subject;
    if (classValue) updateData.class = classValue;
    if (chapter) updateData.chapter = chapter;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (thumbnailUrl) updateData.thumbnail = thumbnailUrl; // ✅ URL from UploadThing

    const updatedFolder = await prisma.videoFolder.update({
      where: { id },
      data: updateData,
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
        }
      }
    });

    const totalDuration = updatedFolder.videos.reduce((acc, video) => {
      const [mins, secs] = video.duration.split(':').map(Number);
      return acc + mins * 60 + secs;
    }, 0);

    const totalViews = updatedFolder.videos.reduce((acc, video) => acc + video.views, 0);
    const totalWatchSeconds = updatedFolder.videos.reduce((acc, video) => 
      acc + video.progress.reduce((sum, p) => sum + p.watchedSeconds, 0), 0
    );

    const formattedFolder = {
      id: updatedFolder.id,
      name: updatedFolder.name,
      subject: updatedFolder.subject,
      class: updatedFolder.class,
      chapter: updatedFolder.chapter,
      description: updatedFolder.description,
      thumbnail: updatedFolder.thumbnail,
      isPublic: updatedFolder.isPublic,
      videoCount: updatedFolder.videos.length,
      totalDuration: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
      totalViews: totalViews,
      totalWatchTime: `${Math.floor(totalWatchSeconds / 3600)}h ${Math.floor((totalWatchSeconds % 3600) / 60)}m`,
      createdAt: updatedFolder.createdAt.toISOString(),
      videos: updatedFolder.videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        views: video.views,
        uniqueViewers: video.progress.filter(p => p.viewCounted).length,
        totalWatchTime: (() => {
          const seconds = video.progress.reduce((sum, p) => sum + p.watchedSeconds, 0);
          return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
        })(),
        uploadDate: video.uploadDate.toISOString(),
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        size: video.size,
        quality: video.quality
      }))
    };

    return NextResponse.json(formattedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}

// GET - Get a single folder
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

    const folder = await prisma.videoFolder.findUnique({
      where: { id },
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
        }
      }
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (session.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });

      if (folder.teacherId !== teacher?.id) {
        return NextResponse.json({ error: 'You can only view your own folders' }, { status: 403 });
      }
    } else if (session.user.role === 'STUDENT') {
      if (!folder.isPublic) {
        return NextResponse.json({ error: 'This folder is private' }, { status: 403 });
      }
    }

    const totalDuration = folder.videos.reduce((acc, video) => {
      const [mins, secs] = video.duration.split(':').map(Number);
      return acc + mins * 60 + secs;
    }, 0);

    const totalViews = folder.videos.reduce((acc, video) => acc + video.views, 0);
    const totalWatchSeconds = folder.videos.reduce((acc, video) => 
      acc + video.progress.reduce((sum, p) => sum + p.watchedSeconds, 0), 0
    );

    const formattedFolder = {
      id: folder.id,
      name: folder.name,
      subject: folder.subject,
      class: folder.class,
      chapter: folder.chapter,
      description: folder.description,
      thumbnail: folder.thumbnail,
      isPublic: folder.isPublic,
      videoCount: folder.videos.length,
      totalDuration: `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`,
      totalViews: totalViews,
      totalWatchTime: `${Math.floor(totalWatchSeconds / 3600)}h ${Math.floor((totalWatchSeconds % 3600) / 60)}m`,
      createdAt: folder.createdAt.toISOString(),
      videos: folder.videos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        views: video.views,
        uniqueViewers: video.progress.filter(p => p.viewCounted).length,
        totalWatchTime: (() => {
          const seconds = video.progress.reduce((sum, p) => sum + p.watchedSeconds, 0);
          return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
        })(),
        uploadDate: video.uploadDate.toISOString(),
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        size: video.size,
        quality: video.quality
      }))
    };

    return NextResponse.json(formattedFolder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json({ error: 'Failed to fetch folder' }, { status: 500 });
  }
}