import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from '@/lib/rate-limit';

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

// Students may add at most this many views / downloads to ONE note per hour.
// Stops a bored student (or a script) from inflating the teacher's numbers.
const TRACK_LIMIT_PER_NOTE_PER_HOUR = 5;

async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// GET - Fetch ALL published notes (filtering is done client-side)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
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
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST - Track download or view (fire-and-forget from the apps)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, action } = await readJson(req);

    if (typeof noteId !== 'string' || !noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }
    if (action !== 'download' && action !== 'view') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Past the per-note cap we still answer "success" (the apps ignore this call's result)
    // but do not count it.
    const perNote = await rateLimit({
      identifier: `note-track:${session.user.id}:${noteId}:${action}`,
      limit: TRACK_LIMIT_PER_NOTE_PER_HOUR,
      window: 3600,
    });
    if (!perNote.success) {
      return NextResponse.json({ success: true, counted: false });
    }

    // updateMany never throws for a missing / unpublished note (update() threw P2025 -> 500)
    const result = await prisma.note.updateMany({
      where: { id: noteId, isPublished: true },
      data: action === 'view' ? { views: { increment: 1 } } : { downloads: { increment: 1 } },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      counted: true,
      message: action === 'view' ? 'View tracked' : 'Download tracked',
    });
  } catch (error) {
    console.error('Error tracking note action:', error);
    return NextResponse.json({ error: 'Failed to track action' }, { status: 500 });
  }
}

// PATCH - Bookmark / unbookmark a note.
//   { noteId, bookmarked: true|false }  -> sets the state (idempotent; what the mobile app sends)
//   { noteId }                          -> toggles (what the website still sends)
// Setting is safer than toggling: if a request succeeds on the server but the phone times out,
// retrying it can't flip the bookmark back.
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { noteId, bookmarked } = await readJson(req);

    if (typeof noteId !== 'string' || !noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    const note = await prisma.note.findFirst({
      where: { id: noteId, isPublished: true },
      select: { id: true },
    });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const key = { noteId_studentId: { noteId, studentId: student.id } };
    const existing = await prisma.noteBookmark.findUnique({ where: key });
    const want = typeof bookmarked === 'boolean' ? bookmarked : !existing;

    if (want && !existing) {
      try {
        await prisma.noteBookmark.create({ data: { noteId, studentId: student.id } });
      } catch (e: any) {
        // P2002 = a parallel request created it first: that is exactly the state we wanted
        if (e?.code !== 'P2002') throw e;
      }
    } else if (!want && existing) {
      // deleteMany doesn't throw if a parallel request already removed it
      await prisma.noteBookmark.deleteMany({ where: { noteId, studentId: student.id } });
    }

    return NextResponse.json({ success: true, action: want ? 'added' : 'removed', bookmarked: want });
  } catch (error) {
    console.error('Error bookmarking note:', error);
    return NextResponse.json({ error: 'Failed to bookmark note' }, { status: 500 });
  }
}
