import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all assignments created by teacher with stats and student profiles
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

    // ✅ Fetch assignments with student profiles
    const assignments = await prisma.assignmentV2.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        title: true,
        description: true,
        subject: true,
        class: true,
        dueDate: true,
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
            fileSize: true,
            remarks: true,
            submittedAt: true,
            student: {
              select: {
                id: true,
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
          select: {
            id: true,
            content: true,
            createdAt: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const assignmentsWithStats = assignments.map((assignment) => {
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject,
        class: assignment.class,
        dueDate: assignment.dueDate,
        fileUrl: assignment.fileUrl,
        fileName: assignment.fileName,
        fileSize: assignment.fileSize,
        isPublished: assignment.isPublished,
        createdAt: assignment.createdAt,
        stats: {
          totalSubmissions: assignment._count.submissions,
          totalComments: assignment._count.comments,
        },
        submissions: assignment.submissions.map(s => ({
          id: s.id,
          status: s.status,
          isCompleted: s.isCompleted,
          fileUrl: s.fileUrl,
          fileName: s.fileName,
          fileSize: s.fileSize,
          remarks: s.remarks,
          submittedAt: s.submittedAt,
          student: {
            id: s.student.id,
            userId: s.student.user.id,
            name: s.student.user.name,
            email: s.student.user.email,
            avatar: s.student.user.avatar,
            phone: s.student.user.phone,
            location: s.student.user.location,
            dateOfBirth: s.student.user.dateOfBirth,
            bio: s.student.user.bio,
          },
        })),
        comments: assignment.comments.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          user: {
            id: c.user.id,
            name: c.user.name,
            email: c.user.email,
            avatar: c.user.avatar,
            role: c.user.role,
          },
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

// POST - Create new assignment (NO MARKS)
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
    const { title, description, subject, class: className, dueDate, fileUrl, fileName, fileSize } = body;

    // ✅ Validation - Removed totalMarks, Added fileUrl required
    if (!title || !description || !subject || !className || !dueDate || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields. PDF file is required.' },
        { status: 400 }
      );
    }

    // ✅ Create assignment WITHOUT totalMarks
    const assignment = await prisma.assignmentV2.create({
      data: {
        title,
        description,
        subject,
        class: className,
        dueDate: new Date(dueDate),
        totalMarks: 0, // Set to 0 since we removed marks
        fileUrl,
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

// PATCH - Mark submission as completed
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

// DELETE - Delete assignment OR delete comment
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
    const commentId = searchParams.get('commentId');

    // ✅ DELETE COMMENT (Teacher can delete any comment on their assignments)
    if (commentId) {
      // Verify comment belongs to teacher's assignment
      const comment = await prisma.assignmentComment.findFirst({
        where: {
          id: commentId,
          assignment: {
            teacherId: teacher.id,
          },
        },
      });

      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found or unauthorized' },
          { status: 404 }
        );
      }

      await prisma.assignmentComment.delete({
        where: { id: commentId },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Comment deleted successfully' 
      });
    }

    // ✅ DELETE ASSIGNMENT
    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID or Comment ID required' }, { status: 400 });
    }

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

    await prisma.assignmentV2.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting:', error);
    return NextResponse.json(
      { error: 'Failed to delete', details: error.message },
      { status: 500 }
    );
  }
}