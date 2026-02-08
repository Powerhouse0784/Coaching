import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch comments for an assignment
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    const comments = await prisma.assignmentComment.findMany({
      where: { assignmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Add comment to assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { assignmentId, content, fileUrl, fileName, fileSize } = body;

    // Validation
    if (!assignmentId || !content) {
      return NextResponse.json({ error: 'Assignment ID and content required' }, { status: 400 });
    }

    const comment = await prisma.assignmentComment.create({
      data: {
        assignmentId,
        userId: session.user.id,
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Like/Unlike comment
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { commentId, action } = body; // action: 'like' or 'unlike'

    if (!commentId || !action) {
      return NextResponse.json({ error: 'Comment ID and action required' }, { status: 400 });
    }

    const comment = await prisma.assignmentComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const updatedComment = await prisma.assignmentComment.update({
      where: { id: commentId },
      data: {
        likes: action === 'like' ? comment.likes + 1 : Math.max(0, comment.likes - 1),
      },
    });

    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete comment (own comment only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    // Verify ownership
    const comment = await prisma.assignmentComment.findFirst({
      where: {
        id: commentId,
        userId: session.user.id,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    await prisma.assignmentComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment', details: error.message },
      { status: 500 }
    );
  }
}
