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

// GET - Fetch all published notes for students
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const subject = searchParams.get('subject') || 'all';
    const classFilter = searchParams.get('class') || 'all';
    const search = searchParams.get('search') || '';

    // Get student record for bookmarks
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    // Build where clause
    const where: any = { isPublished: true };

    // Filter by subject
    if (subject !== 'all') {
      where.subject = subject;
    }

    // Filter by class
    if (classFilter !== 'all') {
      where.class = classFilter;
    }

    // Search
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { chapter: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch notes
    const notes = await prisma.note.findMany({
      where,
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
        bookmarks: student ? {
          where: { studentId: student.id },
          select: { id: true },
        } : false,
        _count: {
          select: {
            bookmarks: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Process notes
    let processedNotes: ProcessedNote[] = notes.map((note: any) => ({
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

    // Apply filters
    if (filter === 'bookmarked' && student) {
      processedNotes = processedNotes.filter((note: ProcessedNote) => note.isBookmarked);
    } else if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      processedNotes = processedNotes.filter(
        (note: ProcessedNote) => new Date(note.createdAt) > oneWeekAgo
      );
    } else if (filter === 'popular') {
      processedNotes = processedNotes.sort((a: ProcessedNote, b: ProcessedNote) => b.downloads - a.downloads);
    }

    return NextResponse.json({ success: true, notes: processedNotes });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Track download
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, action } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Track download
    if (action === 'download') {
      await prisma.note.update({
        where: { id: noteId },
        data: { downloads: { increment: 1 } },
      });

      return NextResponse.json({ success: true, message: 'Download tracked' });
    }

    // Track view
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

// PATCH - Bookmark/unbookmark note
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

    const body = await req.json();
    const { noteId } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.noteBookmark.findUnique({
      where: {
        noteId_studentId: {
          noteId,
          studentId: student.id,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.noteBookmark.delete({
        where: { id: existingBookmark.id },
      });

      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      // Add bookmark
      await prisma.noteBookmark.create({
        data: {
          noteId,
          studentId: student.id,
        },
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
