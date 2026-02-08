import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all assignments created by teacher with stats (OPTIMIZED)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher record
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    // ✅ OPTIMIZED: Select only needed fields, use _count for better performance
    const assignments = await prisma.assignmentV2.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        title: true,
        description: true,
        subject: true,
        class: true,
        dueDate: true,
        totalMarks: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        isPublished: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            comments: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            isCompleted: true,
            fileUrl: true,
            fileName: true,
            remarks: true,
            submittedAt: true,
            student: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ✅ Calculate stats - FIXED: changed completedSubmissions to completed
    const assignmentsWithStats = assignments.map((assignment) => {
      const totalSubmissions = assignment._count.submissions;
      const completedCount = assignment.submissions.filter((s) => s.isCompleted).length;

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        class: assignment.class,
        dueDate: assignment.dueDate,
        totalMarks: assignment.totalMarks,
        fileUrl: assignment.fileUrl,
        fileName: assignment.fileName,
        fileSize: assignment.fileSize,
        isPublished: assignment.isPublished,
        createdAt: assignment.createdAt,
        stats: {
          totalSubmissions,
          completed: completedCount, // ✅ FIXED: was completedSubmissions
        },
        submissions: assignment.submissions.map(s => ({
          id: s.id,
          status: s.status,
          isCompleted: s.isCompleted,
          fileUrl: s.fileUrl,
          fileName: s.fileName,
          remarks: s.remarks,
          submittedAt: s.submittedAt,
          studentId: s.student.id,
          studentName: s.student.user.name,
          studentEmail: s.student.user.email,
          studentAvatar: s.student.user.avatar,
        })),
        comments: assignment.comments.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          userName: c.user.name,
          userEmail: c.user.email,
          userAvatar: c.user.avatar,
        })),
      };
    });

    return NextResponse.json({ success: true, assignments: assignmentsWithStats });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new assignment
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
    const { title, description, subject, class: className, dueDate, totalMarks, fileUrl, fileName, fileSize } = body;

    // Validation
    if (!title || !description || !subject || !className || !dueDate || !totalMarks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignmentV2.create({
      data: {
        title,
        description,
        subject,
        class: className,
        dueDate: new Date(dueDate),
        totalMarks: parseInt(totalMarks),
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
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

// PATCH - Mark submission as completed (Teacher marks student's work as done)
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
    const { submissionId, isCompleted } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    // ✅ Verify the submission belongs to this teacher's assignment
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignment: {
          teacherId: teacher.id,
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or unauthorized' },
        { status: 404 }
      );
    }

    // ✅ Update submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        isCompleted: isCompleted ?? true,
        status: isCompleted ? 'completed' : submission.status,
      },
    });

    return NextResponse.json({ success: true, submission: updatedSubmission });
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission', details: error.message },
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

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 });
    }

    // Verify ownership
    const assignment = await prisma.assignmentV2.findFirst({
      where: {
        id: assignmentId,
        teacherId: teacher.id,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete assignment (cascade will delete submissions and comments)
    await prisma.assignmentV2.delete({
      where: { id: assignmentId },
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