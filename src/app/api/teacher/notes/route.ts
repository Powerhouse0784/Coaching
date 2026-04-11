import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface TeacherNote {
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
  isPublished: boolean;
  isPinned: boolean;
  price: number;  // Added price field
  downloads: number;
  views: number;
  createdAt: string;
  stats: {
    totalBookmarks: number;
  };
}

// GET - Fetch all notes created by teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: { teacherId: teacher.id },
      include: {
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

    const notesWithStats: TeacherNote[] = notes.map((note: any) => ({
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
      isPublished: note.isPublished,
      isPinned: note.isPinned,
      price: note.price || 30,  // Added price field
      downloads: note.downloads,
      views: note.views,
      createdAt: note.createdAt,
      stats: {
        totalBookmarks: note._count.bookmarks,
      },
    }));

    return NextResponse.json({ success: true, notes: notesWithStats });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new note
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      subject, 
      class: className, 
      topic, 
      chapter,
      fileUrl, 
      fileName, 
      fileType,
      fileSize,
      thumbnailUrl,
      isPublished,
      isPinned,
      price  // Added price field
    } = body;

    if (!title || !subject || !className || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Title, subject, class, and file are required' },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        title,
        description: description || null,
        subject,
        class: className,
        topic: topic || null,
        chapter: chapter || null,
        fileUrl,
        fileName,
        fileType: fileType || 'pdf',
        fileSize: fileSize || '0 MB',
        thumbnailUrl: thumbnailUrl || null,
        isPublished: isPublished !== undefined ? isPublished : true,
        isPinned: isPinned || false,
        price: price || 30,  // Added price field with default 30
        teacherId: teacher.id,
      },
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update note (full update)
// PUT - Update note (full update)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { noteId, ...updateData } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Verify ownership
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teacherId: teacher.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    // Prepare update data
    const dataToUpdate: any = {};
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.subject !== undefined) dataToUpdate.subject = updateData.subject;
    if (updateData.class !== undefined) dataToUpdate.class = updateData.class;
    if (updateData.topic !== undefined) dataToUpdate.topic = updateData.topic;
    if (updateData.chapter !== undefined) dataToUpdate.chapter = updateData.chapter;
    if (updateData.fileUrl !== undefined) dataToUpdate.fileUrl = updateData.fileUrl;
    if (updateData.fileName !== undefined) dataToUpdate.fileName = updateData.fileName;
    if (updateData.fileType !== undefined) dataToUpdate.fileType = updateData.fileType;
    if (updateData.fileSize !== undefined) dataToUpdate.fileSize = updateData.fileSize;
    if (updateData.thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = updateData.thumbnailUrl;
    if (updateData.isPublished !== undefined) dataToUpdate.isPublished = updateData.isPublished;
    if (updateData.isPinned !== undefined) dataToUpdate.isPinned = updateData.isPinned;
    if (updateData.price !== undefined) dataToUpdate.price = updateData.price;  // Add this line

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, note: updatedNote });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Toggle actions
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { noteId, action, ...updateData } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Verify ownership
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teacherId: teacher.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'toggle-publish') {
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: { isPublished: !note.isPublished },
      });
      return NextResponse.json({ success: true, note: updatedNote });
    }

    if (action === 'toggle-pin') {
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: { isPinned: !note.isPinned },
      });
      return NextResponse.json({ success: true, note: updatedNote });
    }

    // Regular update
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
    });

    return NextResponse.json({ success: true, note: updatedNote });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete note
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teacherId: teacher.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note', details: error.message },
      { status: 500 }
    );
  }
}