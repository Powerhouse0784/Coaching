import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { assignmentId, content, fileUrl } = body

    if (!assignmentId || (!content && !fileUrl)) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID and content or file required' },
        { status: 400 }
      )
    }

    // Get student by userId (string UUID)
    const studentResults = await prisma.$queryRaw`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as any[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentId = studentResults[0].id

    // Check if assignment belongs to a course the student is enrolled in
    const enrollmentCheck = await prisma.$queryRaw`
      SELECT e.id 
      FROM "Enrollment" e
      JOIN "Assignment" a ON e."courseId" = a."courseId"
      WHERE a.id = ${assignmentId} AND e."studentId" = ${studentId}
    ` as any[]

    if (enrollmentCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in course or assignment not found' },
        { status: 403 }
      )
    }

    // Check if already submitted
    const existingSubmission = await prisma.$queryRaw`
      SELECT id FROM "AssignmentSubmission" 
      WHERE "assignmentId" = ${assignmentId} AND "studentId" = ${studentId}
    ` as any[]

    if (existingSubmission.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Assignment already submitted' },
        { status: 400 }
      )
    }

    // Create submission
    const submissionResult = await prisma.$queryRaw`
      INSERT INTO "AssignmentSubmission" (
        id, "assignmentId", "studentId", content, "fileUrl", 
        "submittedAt", "isEvaluated", marks, feedback
      )
      VALUES (
        gen_random_uuid(),
        ${assignmentId},
        ${studentId},
        ${content || null},
        ${fileUrl || null},
        NOW(),
        false,
        null,
        null
      )
      RETURNING id, "assignmentId", "studentId", content, "fileUrl", "submittedAt"
    ` as any[]

    return NextResponse.json({
      success: true,
      data: submissionResult[0],
      message: 'Assignment submitted successfully',
    })
  } catch (error) {
    console.error('Submit assignment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}
