import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET - Fetch all assignments for student (OPTIMIZED)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student record
    let student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    // If teacher is accessing, create temporary student record
    if (!student && session.user.role === 'TEACHER') {
      student = await prisma.student.create({
        data: { userId: session.user.id },
      });
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';

    // ✅ OPTIMIZED: Only fetch necessary fields, no deep nesting
    const assignments = await prisma.assignmentV2.findMany({
      where: { isPublished: true },
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
        createdAt: true,
        teacher: {
          select: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        submissions: {
          where: { studentId: student.id },
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
            remarks: true,
            status: true,
            isCompleted: true,
            submittedAt: true,
          },
        },
        _count: {
          select: {
            submissions: true,
            comments: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Process assignments
    const now = new Date();
    let processedAssignments = assignments.map((assignment) => {
      const mySubmission = assignment.submissions[0] || null;

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
        createdAt: assignment.createdAt,
        teacher: {
          name: assignment.teacher.user.name,
          avatar: assignment.teacher.user.avatar,
        },
        mySubmission,
        stats: {
          totalSubmissions: assignment._count.submissions,
          totalComments: assignment._count.comments,
        },
      };
    });

    // ✅ REMOVED 'overdue' filter completely
    if (filter === 'pending') {
      processedAssignments = processedAssignments.filter((a) => !a.mySubmission);
    } else if (filter === 'submitted') {
      processedAssignments = processedAssignments.filter((a) => a.mySubmission);
    }

    return NextResponse.json({ 
      success: true, 
      assignments: processedAssignments,
    });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Submit assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student && session.user.role === 'TEACHER') {
      student = await prisma.student.create({
        data: { userId: session.user.id },
      });
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { assignmentId, fileUrl, fileName, fileSize, remarks } = body;

    if (!assignmentId || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Assignment ID, file URL, and file name are required' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.assignmentV2.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      );
    }

    // ✅ Create submission with pending status
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: student.id,
        fileUrl,
        fileName,
        fileSize: fileSize || '0 MB',
        remarks: remarks || null,
        status: 'pending',
        isCompleted: false,
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Mark assignment as complete
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let student = await prisma.student.findUnique({
      where: { userId: session.user.id },
    });

    if (!student && session.user.role === 'TEACHER') {
      student = await prisma.student.create({
        data: { userId: session.user.id },
      });
    }

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { submissionId, isCompleted } = body;

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    // Verify ownership
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        studentId: student.id,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or unauthorized' },
        { status: 404 }
      );
    }

    // ✅ Update submission to completed
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