import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { submissionId, marks, feedback } = body

    if (!submissionId || marks === undefined) {
      return NextResponse.json(
        { success: false, error: 'Submission ID and marks required' },
        { status: 400 }
      )
    }

    // Verify teacher owns this assignment
    const assignmentCheck = await prisma.$queryRaw`
      SELECT a.id 
      FROM "Assignment" a
      JOIN "Teacher" t ON a."teacherId" = t.id
      WHERE a.id IN (
        SELECT "assignmentId" FROM "AssignmentSubmission" 
        WHERE id = ${submissionId}
      ) AND t."userId" = ${session.user.id}
    ` as any[]

    if (assignmentCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found or access denied' },
        { status: 403 }
      )
    }

    // Update submission with marks and feedback
    await prisma.$executeRaw`
      UPDATE "AssignmentSubmission" 
      SET 
        marks = ${marks},
        feedback = ${feedback || null},
        "isEvaluated" = true,
        "evaluatedAt" = NOW()
      WHERE id = ${submissionId}
    `

    // Get updated submission details
    const updatedSubmission = await prisma.$queryRaw`
      SELECT 
        id,
        "submittedAt",
        marks,
        feedback,
        "isEvaluated",
        "studentId",
        "assignmentId"
      FROM "AssignmentSubmission" 
      WHERE id = ${submissionId}
    ` as any[]

    return NextResponse.json({
      success: true,
      data: updatedSubmission[0],
      message: 'Assignment evaluated successfully',
    })
  } catch (error) {
    console.error('Evaluate assignment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate assignment' },
      { status: 500 }
    )
  }
}
