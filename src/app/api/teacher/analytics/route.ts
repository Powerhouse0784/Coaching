import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface TeacherResult {
  id: string
}

interface EnrollmentResult {
  enrolledAt: string
}

interface ProgressResult {
  watchedSeconds: number
  isCompleted: boolean
}

interface AssignmentResult {
  submissions: number
}

interface AnalyticsData {
  enrollmentTrends: Record<string, number>
  engagement: {
    totalWatchTime: number
    completionRate: number
    avgSubmissionRate: number
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher
    const teacherResults = await prisma.$queryRaw<TeacherResult[]>`
      SELECT id FROM "Teacher" WHERE "userId" = ${session.user.id}
    ` as TeacherResult[]

    if (!teacherResults || teacherResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    const teacherId = teacherResults[0].id
    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')

    // Enrollment trends (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let enrollmentWhere = `WHERE e."courseId" IN (
      SELECT id FROM "Course" WHERE "teacherId" = ${teacherId}
    ) AND e."enrolledAt" >= ${twelveMonthsAgo.toISOString()}`

    if (courseId) {
      enrollmentWhere += ` AND e."courseId" = ${courseId}`
    }

    const enrollments = await prisma.$queryRaw<EnrollmentResult[]>`
      SELECT "enrolledAt" FROM "Enrollment" e
      ${enrollmentWhere}
    ` as EnrollmentResult[]

    // Group enrollments by month
    const enrollmentTrends: Record<string, number> = {}
    enrollments.forEach((enrollment) => {
      const month = enrollment.enrolledAt.slice(0, 7) // YYYY-MM
      enrollmentTrends[month] = (enrollmentTrends[month] || 0) + 1
    })

    // Student engagement (watch time, completion rates)
    const progressData = await prisma.$queryRaw<ProgressResult[]>`
      SELECT "watchedSeconds", "isCompleted" 
      FROM "Progress" p
      JOIN "Lecture" l ON p."lectureId" = l.id
      JOIN "Module" m ON l."moduleId" = m.id
      JOIN "Course" c ON m."courseId" = c.id
      WHERE c."teacherId" = ${teacherId}
    ` as ProgressResult[]

    const totalWatchTime = progressData.reduce(
      (sum: number, p: ProgressResult) => sum + p.watchedSeconds,
      0
    )
    
    const completionRate = progressData.length > 0
      ? (progressData.filter((p: ProgressResult) => p.isCompleted).length / progressData.length) * 100
      : 0

    // Assignment submission rates
    const assignments = await prisma.$queryRaw<AssignmentResult[]>`
      SELECT COUNT(s.id) as submissions
      FROM "Assignment" a
      LEFT JOIN "AssignmentSubmission" s ON a.id = s."assignmentId"
      WHERE a."teacherId" = ${teacherId}
      GROUP BY a.id
    ` as AssignmentResult[]

    const avgSubmissionRate = assignments.length > 0
      ? assignments.reduce((sum: number, a: AssignmentResult) => sum + (a.submissions || 0), 0) / assignments.length
      : 0

    const analyticsData: AnalyticsData = {
      enrollmentTrends,
      engagement: {
        totalWatchTime: Math.floor(totalWatchTime / 60), // Convert to minutes
        completionRate: Math.round(completionRate),
        avgSubmissionRate: Math.round(avgSubmissionRate),
      },
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
