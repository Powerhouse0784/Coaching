import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// GET - Fetch all AI chat messages for the teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messages = await prisma.teacherChatMessage.findMany({
      where: { senderId: session.user.id },
      include: {
        sender: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Send a message and get AI response
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { content, fileUrl, fileName, fileType, fileSize, conversationHistory } = body;

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: 'Message content or file is required' },
        { status: 400 }
      );
    }

    // Save user message to database
    const userMessage = await prisma.teacherChatMessage.create({
      data: {
        content: content || 'Uploaded a file',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        senderId: session.user.id,
        isRead: true,
        readBy: [session.user.id],
      },
      include: {
        sender: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Prepare messages for Groq
    const groqMessages: any[] = [];

    // Add conversation history if provided (last 10 messages for context)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          groqMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
    }

    // Add current user message
    let currentMessageContent = content || 'I uploaded a file. Please help me understand it.';
    
    if (fileUrl) {
      currentMessageContent += `\n\n[File attached: ${fileName} (${fileType})]`;
      if (fileType === 'image') {
        currentMessageContent += '\nNote: This is an image file. I can help you with questions about it.';
      } else if (fileType === 'pdf') {
        currentMessageContent += '\nNote: This is a PDF document. Please describe what you need help with.';
      }
    }

    groqMessages.push({
      role: 'user',
      content: currentMessageContent,
    });

    // Get AI response from Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are EduGenius, an advanced AI teaching assistant for EduElite educational platform. You help teachers with:

**Core Expertise:**
- Lesson Planning: Create detailed, engaging lesson plans for any subject and grade level
- Content Creation: Generate quizzes, assignments, worksheets, and study materials
- Subject Mastery: Provide expert knowledge across Mathematics, Science, English, History, Geography, and more
- Teaching Strategies: Suggest innovative teaching methods, classroom management techniques, and student engagement tactics
- Assessment & Evaluation: Design rubrics, grading criteria, and evaluation frameworks
- Curriculum Design: Help structure courses, units, and learning objectives
- Educational Technology: Recommend tools, apps, and digital resources
- Student Support: Advise on differentiated instruction, special needs, and learning difficulties
- Professional Development: Share best practices, research-backed methods, and teaching trends

**Response Style:**
- Professional yet friendly and approachable
- Clear, structured, and actionable
- Provide examples and practical applications
- Use bullet points, numbered lists, and formatting for readability
- Cite educational research or theories when relevant
- Ask clarifying questions if needed
- Encourage creativity and innovation in teaching

**File Analysis:**
When files are mentioned, provide thoughtful analysis and suggestions based on the file type:
- Images: Offer ideas for educational use, visual learning strategies
- PDFs: Suggest ways to incorporate the content into lessons, create activities

Always maintain a supportive, encouraging tone that empowers teachers to be their best.`,
        },
        ...groqMessages,
      ],
      model: 'llama-3.3-70b-versatile', // Fast and high-quality
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const aiResponseText = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    // Save AI response to database
    const aiMessage = await prisma.teacherChatMessage.create({
      data: {
        content: aiResponseText,
        senderId: session.user.id,
        isRead: true,
        readBy: [session.user.id],
      },
      include: {
        sender: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      userMessage,
      aiMessage,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Clear chat history
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.teacherChatMessage.deleteMany({
      where: { senderId: session.user.id },
    });

    return NextResponse.json({ success: true, message: 'Chat history cleared' });
  } catch (error: any) {
    console.error('Error clearing messages:', error);
    return NextResponse.json(
      { error: 'Failed to clear messages', details: error.message },
      { status: 500 }
    );
  }
}