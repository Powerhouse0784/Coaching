import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all doubts (with filters)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const subject = searchParams.get('subject') || 'all';
    const search = searchParams.get('search') || '';

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    const where: any = {};

    // Filter by status
    if (filter === 'open') {
      where.status = 'open';
    } else if (filter === 'solved') {
      where.status = 'solved';
    } else if (filter === 'myDoubts' && student) {
      where.studentId = student.id;
    } else if (filter === 'all') {
      if (!student) {
        where.status = 'open';
      } else {
        where.OR = [
          { status: 'open' },
          { AND: [{ status: 'solved' }, { studentId: student.id }] }
        ];
      }
    }

    if (subject !== 'all') {
      where.subject = subject;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const doubts = await prisma.doubt.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        upvotedBy: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        _count: {
          select: {
            replies: true,
            upvotedBy: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
            upvotedBy: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          },
          orderBy: {
            isPinned: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const processedDoubts = doubts.map((doubt) => ({
      ...doubt,
      student: {
        id: doubt.student.user.id,
        name: doubt.student.user.name,
        avatar: doubt.student.user.avatar,
        email: doubt.student.user.email,
      },
      isMyDoubt: doubt.studentId === student?.id,
      hasUpvoted: doubt.upvotedBy.length > 0,
      stats: {
        totalReplies: doubt._count.replies,
        totalUpvotes: doubt._count.upvotedBy,
      },
      replies: doubt.replies.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        imageUrl: reply.imageUrl,
        imageName: reply.imageName,
        pdfUrl: reply.pdfUrl,
        pdfName: reply.pdfName,
        isPinned: reply.isPinned,
        isAccepted: reply.isAccepted,
        upvotes: reply.upvotes,
        createdAt: reply.createdAt,
        user: {
          id: reply.user.id,
          name: reply.user.name,
          avatar: reply.user.avatar,
          role: reply.user.role,
        },
        isMyReply: reply.userId === session.user.id,
        hasUpvoted: reply.upvotedBy.length > 0,
      })),
    }));

    return NextResponse.json({ success: true, doubts: processedDoubts });
  } catch (error: any) {
    console.error('Error fetching doubts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doubts', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new doubt
export async function POST(req: NextRequest) {
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
    const { title, description, subject, class: className, priority, imageUrl, imageName, pdfUrl, pdfName } = body;

    if (!title || !description || !subject) {
      return NextResponse.json(
        { error: 'Title, description, and subject are required' },
        { status: 400 }
      );
    }

    const doubt = await prisma.doubt.create({
      data: {
        title,
        description,
        subject,
        class: className || null,
        priority: priority || 'normal',
        imageUrl: imageUrl || null,
        imageName: imageName || null,
        pdfUrl: pdfUrl || null,
        pdfName: pdfName || null,
        studentId: student.id,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, doubt }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating doubt:', error);
    return NextResponse.json(
      { error: 'Failed to create doubt', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update doubt (mark as solved, etc.)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { doubtId, action, replyId } = body;

    if (!doubtId) {
      return NextResponse.json({ error: 'Doubt ID required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    // UPVOTE DOUBT
    if (action === 'upvote') {
      const existingUpvote = await prisma.doubtUpvote.findUnique({
        where: {
          doubtId_userId: {
            doubtId,
            userId: session.user.id,
          },
        },
      });

      if (existingUpvote) {
        await prisma.doubtUpvote.delete({
          where: { id: existingUpvote.id },
        });

        await prisma.doubt.update({
          where: { id: doubtId },
          data: { upvotes: { decrement: 1 } },
        });

        return NextResponse.json({ success: true, action: 'removed' });
      } else {
        await prisma.doubtUpvote.create({
          data: {
            doubtId,
            userId: session.user.id,
          },
        });

        await prisma.doubt.update({
          where: { id: doubtId },
          data: { upvotes: { increment: 1 } },
        });

        return NextResponse.json({ success: true, action: 'added' });
      }
    }

    // SOLVE DOUBT
    if (action === 'solve') {
      const doubt = await prisma.doubt.findUnique({
        where: { id: doubtId },
      });

      if (!doubt) {
        return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
      }

      const isOwner = student && doubt.studentId === student.id;
      const isTeacher = teacher && session.user.role === 'TEACHER';

      if (!isOwner && !isTeacher) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const updatedDoubt = await prisma.doubt.update({
        where: { id: doubtId },
        data: {
          status: 'solved',
          isSolved: true,
          solvedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, doubt: updatedDoubt });
    }

    // PIN REPLY (Teacher only)
    if (action === 'pin' && replyId) {
      if (!teacher) {
        return NextResponse.json({ error: 'Only teachers can pin replies' }, { status: 403 });
      }

      await prisma.doubtReply.updateMany({
        where: { doubtId },
        data: { isPinned: false },
      });

      const reply = await prisma.doubtReply.update({
        where: { id: replyId },
        data: { isPinned: true },
      });

      return NextResponse.json({ success: true, reply });
    }

    // ACCEPT REPLY (Student who posted doubt only)
    if (action === 'accept' && replyId) {
      const doubt = await prisma.doubt.findUnique({
        where: { id: doubtId },
      });

      if (!doubt || !student || doubt.studentId !== student.id) {
        return NextResponse.json({ error: 'Only doubt owner can accept replies' }, { status: 403 });
      }

      await prisma.doubtReply.updateMany({
        where: { doubtId },
        data: { isAccepted: false },
      });

      const reply = await prisma.doubtReply.update({
        where: { id: replyId },
        data: { isAccepted: true },
      });

      return NextResponse.json({ success: true, reply });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating doubt:', error);
    return NextResponse.json(
      { error: 'Failed to update doubt', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete doubt
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doubtId = searchParams.get('id');

    if (!doubtId) {
      return NextResponse.json({ error: 'Doubt ID required' }, { status: 400 });
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
      include: {
        student: true,
      },
    });

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    const isOwner = doubt.student.userId === session.user.id;
    const isTeacher = session.user.role === 'TEACHER';

    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.doubt.delete({
      where: { id: doubtId },
    });

    return NextResponse.json({ success: true, message: 'Doubt deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting doubt:', error);
    return NextResponse.json(
      { error: 'Failed to delete doubt', details: error.message },
      { status: 500 }
    );
  }
}
