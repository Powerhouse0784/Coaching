import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all chat messages (teachers only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized - Teachers only' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch messages
    const messages = await prisma.teacherChatMessage.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Reverse to show oldest first
    const sortedMessages = messages.reverse();

    // Process messages
    const processedMessages = sortedMessages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileType: msg.fileType,
      fileSize: msg.fileSize,
      isRead: msg.isRead,
      readBy: msg.readBy,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        avatar: msg.sender.avatar,
      },
      isSelf: msg.senderId === session.user.id,
    }));

    return NextResponse.json({ success: true, messages: processedMessages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Send new message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized - Teachers only' }, { status: 401 });
    }

    const body = await req.json();
    const { content, fileUrl, fileName, fileType, fileSize } = body;

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: 'Message content or file required' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.teacherChatMessage.create({
      data: {
        content: content || '',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: {
        ...message,
        isSelf: true,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized - Teachers only' }, { status: 401 });
    }

    const body = await req.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Message IDs array required' }, { status: 400 });
    }

    // Update messages
    await prisma.teacherChatMessage.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: session.user.id }, // Don't mark own messages as read
      },
      data: {
        isRead: true,
        readBy: {
          push: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Messages marked as read' });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete message (own messages only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized - Teachers only' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Verify ownership
    const message = await prisma.teacherChatMessage.findFirst({
      where: {
        id: messageId,
        senderId: session.user.id,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 });
    }

    // Delete message
    await prisma.teacherChatMessage.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message', details: error.message },
      { status: 500 }
    );
  }
}