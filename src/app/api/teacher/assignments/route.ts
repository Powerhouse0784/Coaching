// app/api/teacher/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all assignments for teacher
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher record
    let teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher && session.user.role === 'TEACHER') {
      teacher = await prisma.teacher.create({
        data: { userId: session.user.id },
      });
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // Fetch all assignments for this teacher
    const assignments = await prisma.assignmentV2.findMany({
      where: { teacherId: teacher.id },
      include: {
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    phone: true,
                    location: true,
                    dateOfBirth: true,
                    bio: true,
                  },
                },
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            submissions: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Process assignments with proper null checks
    const processedAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      class: assignment.class,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks || 0,
      fileUrl: assignment.fileUrl,
      fileName: assignment.fileName,
      fileSize: assignment.fileSize,
      isPublished: assignment.isPublished,
      createdAt: assignment.createdAt,
      stats: {
        totalSubmissions: assignment._count?.submissions || 0,
        totalComments: assignment._count?.comments || 0,
      },
      submissions: assignment.submissions.map((submission) => ({
        id: submission.id,
        status: submission.status,
        isCompleted: submission.isCompleted,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        fileSize: submission.fileSize,
        remarks: submission.remarks,
        submittedAt: submission.submittedAt,
        student: {
          id: submission.student.id,
          userId: submission.student.userId,
          name: submission.student.user.name || 'Unknown',
          email: submission.student.user.email,
          avatar: submission.student.user.avatar,
          phone: submission.student.user.phone,
          location: submission.student.user.location,
          dateOfBirth: submission.student.user.dateOfBirth,
          bio: submission.student.user.bio,
        },
      })),
      comments: assignment.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name || 'Unknown',
          email: comment.user.email,
          avatar: comment.user.avatar,
          role: comment.user.role,
        },
      })),
    }));

    // Apply filters
    let filtered = processedAssignments;
    if (filter === 'published') {
      filtered = filtered.filter((a) => a.isPublished);
    } else if (filter === 'draft') {
      filtered = filtered.filter((a) => !a.isPublished);
    }

    return NextResponse.json({ success: true, assignments: filtered });
  } catch (error: any) {
    console.error('Error fetching teacher assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher record
    let teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher && session.user.role === 'TEACHER') {
      teacher = await prisma.teacher.create({
        data: { userId: session.user.id },
      });
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      title, 
      description, 
      subject, 
      class: className, 
      dueDate, 
      fileUrl, 
      fileName, 
      fileSize,
      totalMarks = 0 
    } = body;

    if (!title || !description || !subject || !className || !dueDate || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignmentV2.create({
      data: {
        title,
        description,
        subject,
        class: className,
        dueDate: new Date(dueDate),
        fileUrl,
        fileName,
        fileSize: fileSize || '0 MB',
        totalMarks: parseInt(totalMarks) || 0,
        teacherId: teacher.id,
        isPublished: true,
      },
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete assignment
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // Verify assignment belongs to teacher
    const assignment = await prisma.assignmentV2.findFirst({
      where: {
        id,
        teacherId: teacher.id,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete assignment (cascading deletes will handle submissions and comments)
    await prisma.assignmentV2.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment', details: error.message },
      { status: 500 }
    );
  }
}