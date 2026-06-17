import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface ProcessedNote {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  class: string;
  topic: string | null;
  chapter: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
  downloads: number;
  views: number;
  createdAt: string;
  teacher: {
    name: string;
    avatar: string | null;
  };
  isBookmarked: boolean;
  stats: {
    totalBookmarks: number;
  };
}

// GET - Fetch ALL published notes (filtering is done client-side)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student record for bookmark lookup
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    // Fetch all published notes — no filter/search/subject/class params
    const notes = await prisma.note.findMany({
      where: { isPublished: true },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        bookmarks: student
          ? { where: { studentId: student.id }, select: { id: true } }
          : false,
        _count: {
          select: { bookmarks: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const processedNotes: ProcessedNote[] = notes.map((note: any) => ({
      id: note.id,
      title: note.title,
      description: note.description,
      subject: note.subject,
      class: note.class,
      topic: note.topic,
      chapter: note.chapter,
      fileUrl: note.fileUrl,
      fileName: note.fileName,
      fileType: note.fileType,
      fileSize: note.fileSize,
      thumbnailUrl: note.thumbnailUrl,
      isPinned: note.isPinned,
      downloads: note.downloads,
      views: note.views,
      createdAt: note.createdAt,
      teacher: {
        name: note.teacher.user.name,
        avatar: note.teacher.user.avatar,
      },
      isBookmarked: student && note.bookmarks ? note.bookmarks.length > 0 : false,
      stats: {
        totalBookmarks: note._count.bookmarks,
      },
    }));

    return NextResponse.json({ success: true, notes: processedNotes });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Track download or view (fire-and-forget from frontend)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, action } = await req.json();

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    if (action === 'download') {
      await prisma.note.update({
        where: { id: noteId },
        data: { downloads: { increment: 1 } },
      });
      return NextResponse.json({ success: true, message: 'Download tracked' });
    }

    if (action === 'view') {
      await prisma.note.update({
        where: { id: noteId },
        data: { views: { increment: 1 } },
      });
      return NextResponse.json({ success: true, message: 'View tracked' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error tracking note action:', error);
    return NextResponse.json(
      { error: 'Failed to track action', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Bookmark / unbookmark a note
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { noteId } = await req.json();

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    const existingBookmark = await prisma.noteBookmark.findUnique({
      where: {
        noteId_studentId: { noteId, studentId: student.id },
      },
    });

    if (existingBookmark) {
      await prisma.noteBookmark.delete({ where: { id: existingBookmark.id } });
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      await prisma.noteBookmark.create({
        data: { noteId, studentId: student.id },
      });
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    console.error('Error bookmarking note:', error);
    return NextResponse.json(
      { error: 'Failed to bookmark note', details: error.message },
      { status: 500 }
    );
  }
}