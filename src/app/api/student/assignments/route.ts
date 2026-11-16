// app/api/student/assignments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from '@/lib/rate-limit';

async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

async function getOrCreateStudent(userId: string, role: string) {
  let student = await prisma.student.findUnique({ where: { userId } });
  if (!student && role === 'TEACHER') {
    student = await prisma.student.create({ data: { userId } });
  }
  return student;
}

// GET - Fetch ALL assignments (filtering done client-side)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await getOrCreateStudent(session.user.id, session.user.role);
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

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
              select: { name: true, avatar: true },
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
          select: { submissions: true, comments: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

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
      createdAt: assignment.createdAt,
      teacher: {
        name: assignment.teacher?.user?.name || 'Unknown',
        avatar: assignment.teacher?.user?.avatar || null,
      },
      mySubmission: assignment.submissions[0] ?? null,
      stats: {
        totalSubmissions: assignment._count.submissions || 0,
        totalComments: assignment._count.comments || 0,
      },
    }));

    return NextResponse.json({ success: true, assignments: processedAssignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

// POST - Submit assignment (late submissions are allowed; the apps show them as past due)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await getOrCreateStudent(session.user.id, session.user.role);
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const rl = await rateLimit({ identifier: `asg-submit:${session.user.id}`, limit: 10, window: 600 });
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many submissions. Please wait a few minutes.' }, { status: 429 });
    }

    const body = await readJson(req);
    const assignmentId = str(body.assignmentId, 100);
    const fileUrl = str(body.fileUrl, 2000);
    const fileName = str(body.fileName, 255);
    const fileSize = str(body.fileSize, 30);
    const remarks = str(body.remarks, 500);

    if (!assignmentId || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: 'Assignment ID, file URL, and file name are required' },
        { status: 400 }
      );
    }
    if (!/^https?:\/\//i.test(fileUrl)) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // only assignments the student can actually see in the list
    const assignment = await prisma.assignmentV2.findFirst({
      where: { id: assignmentId, isPublished: true },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    try {
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId: student.id,
          fileUrl,
          fileName,
          fileSize: fileSize || '0 MB',
          remarks,
          status: 'pending',
          isCompleted: false,
        },
      });
      return NextResponse.json({ success: true, submission }, { status: 201 });
    } catch (e: any) {
      // P2002 = unique (assignmentId, studentId): a double tap or a second device got there first.
      // Relying on the DB constraint (instead of "check then insert") makes this race-proof.
      if (e?.code === 'P2002') {
        return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}

// PATCH - Mark a submission as done (or undo it with isCompleted: false)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await getOrCreateStudent(session.user.id, session.user.role);
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await readJson(req);
    const submissionId = str(body.submissionId, 100);

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    const submission = await prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, studentId: student.id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found or unauthorized' },
        { status: 404 }
      );
    }

    // Before: `isCompleted ?? true` + `status: isCompleted ? ... : ...` disagreed when the field was
    // missing (flag set, status untouched). One variable now drives both.
    const done = body.isCompleted !== false;
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        isCompleted: done,
        status: done ? 'completed' : submission.status === 'completed' ? 'pending' : submission.status,
      },
    });

    return NextResponse.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
