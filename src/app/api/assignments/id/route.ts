import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: { id: string }
}

interface AssignmentResult {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxMarks: number
  teacherName: string
  teacherAvatar: string | null
}

interface SubmissionResult {
  id: string
  submittedAt: string
  marks: number | null
  feedback: string | null
  studentName: string
  studentAvatar: string | null
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Assignment ID required' },
        { status: 400 }
      )
    }

    // Get assignment details
    const assignmentResults = await prisma.$queryRaw<AssignmentResult[]>`
      SELECT 
        a.id,
        a.title,
        a.description,
        a."dueDate",
        a."maxMarks",
        tu.name as "teacherName",
        tu.avatar as "teacherAvatar"
      FROM "Assignment" a
      JOIN "Teacher" t ON a."teacherId" = t.id
      JOIN "User" tu ON t."userId" = tu.id
      WHERE a.id = ${id}
    ` as AssignmentResult[]

    const assignment = assignmentResults[0]
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Get submissions for this assignment
    const submissions = await prisma.$queryRaw<SubmissionResult[]>`
      SELECT 
        s.id,
        s."submittedAt",
        s.marks,
        s.feedback,
        su.name as "studentName",
        su.avatar as "studentAvatar"
      FROM "AssignmentSubmission" s
      JOIN "Student" st ON s."studentId" = st.id
      JOIN "User" su ON st."userId" = su.id
      WHERE s."assignmentId" = ${id}
      ORDER BY s."submittedAt" DESC
    ` as SubmissionResult[]

    return NextResponse.json({
      success: true,
      data: {
        ...assignment,
        submissions,
        totalSubmissions: submissions.length,
        pendingEvaluation: submissions.filter(s => s.marks === null).length,
      },
    })
  } catch (error) {
    console.error('Get assignment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}
