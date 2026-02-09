import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST - Add reply to doubt
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { doubtId, content, imageUrl, imageName, pdfUrl, pdfName } = body;

    if (!doubtId || !content) {
      return NextResponse.json(
        { error: 'Doubt ID and content are required' },
        { status: 400 }
      );
    }

    // Check if doubt exists
    const doubt = await prisma.doubt.findUnique({
      where: { id: doubtId },
    });

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    // Create reply
    const reply = await prisma.doubtReply.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        imageName: imageName || null,
        pdfUrl: pdfUrl || null,
        pdfName: pdfName || null,
        doubtId,
        userId: session.user.id,
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

    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Upvote reply
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { replyId } = body;

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID required' }, { status: 400 });
    }

    // Check for existing upvote
    const existingUpvote = await prisma.doubtReplyUpvote.findUnique({
      where: {
        replyId_userId: {
          replyId,
          userId: session.user.id,
        },
      },
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.doubtReplyUpvote.delete({
        where: { id: existingUpvote.id },
      });

      const reply = await prisma.doubtReply.update({
        where: { id: replyId },
        data: { upvotes: { decrement: 1 } },
      });

      return NextResponse.json({ success: true, action: 'removed', reply });
    } else {
      // Add upvote
      await prisma.doubtReplyUpvote.create({
        data: {
          replyId,
          userId: session.user.id,
        },
      });

      const reply = await prisma.doubtReply.update({
        where: { id: replyId },
        data: { upvotes: { increment: 1 } },
      });

      return NextResponse.json({ success: true, action: 'added', reply });
    }
  } catch (error: any) {
    console.error('Error upvoting reply:', error);
    return NextResponse.json(
      { error: 'Failed to upvote reply', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete reply
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const replyId = searchParams.get('id');

    if (!replyId) {
      return NextResponse.json({ error: 'Reply ID required' }, { status: 400 });
    }

    const reply = await prisma.doubtReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    // Only reply owner or teacher can delete
    const isOwner = reply.userId === session.user.id;
    const isTeacher = session.user.role === 'TEACHER';

    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.doubtReply.delete({
      where: { id: replyId },
    });

    return NextResponse.json({ success: true, message: 'Reply deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting reply:', error);
    return NextResponse.json(
      { error: 'Failed to delete reply', details: error.message },
      { status: 500 }
    );
  }
}