import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface TeacherResult {
  id: string
}

interface CourseResult {
  id: string
  title: string
  price: number
  enrollments: number
  modules: number
}

interface EnrollmentResult {
  id: string
  enrolledAt: string
}

interface LiveClassResult {
  id: string
  title: string
  scheduledAt: string
  batchName: string
}

interface SubmissionResult {
  count: number
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
        { success: false, error: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const teacherId = teacherResults[0].id

    // Get teacher's courses with enrollment & module counts
    const courses = await prisma.$queryRaw<CourseResult[]>`
      SELECT 
        c.id,
        c.title,
        c.price,
        COUNT(e.id) as enrollments,
        COUNT(m.id) as modules
      FROM "Course" c
      LEFT JOIN "Enrollment" e ON c.id = e."courseId"
      LEFT JOIN "Module" m ON c.id = m."courseId"
      WHERE c."teacherId" = ${teacherId}
      GROUP BY c.id, c.title, c.price
      ORDER BY c."createdAt" DESC
    ` as CourseResult[]

    // Get total students
    const totalStudentsResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(DISTINCT e."studentId") as count
      FROM "Enrollment" e
      JOIN "Course" c ON e."courseId" = c.id
      WHERE c."teacherId" = ${teacherId}
    ` as { count: number }[]
    const totalStudents = totalStudentsResult[0]?.count || 0

    // Get pending submissions
    const pendingSubmissionsResult = await prisma.$queryRaw<SubmissionResult[]>`
      SELECT COUNT(s.id) as count
      FROM "AssignmentSubmission" s
      JOIN "Assignment" a ON s."assignmentId" = a.id
      WHERE a."teacherId" = ${teacherId} AND s."isEvaluated" = false
    ` as SubmissionResult[]
    const pendingSubmissions = pendingSubmissionsResult[0]?.count || 0

    // Get upcoming live classes
    const upcomingClasses = await prisma.$queryRaw<LiveClassResult[]>`
      SELECT 
        lc.id,
        lc.title,
        lc."scheduledAt",
        b.name as "batchName"
      FROM "LiveClass" lc
      LEFT JOIN "Batch" b ON lc."batchId" = b.id
      WHERE lc."teacherId" = ${teacherId} AND lc."scheduledAt" >= NOW()
      ORDER BY lc."scheduledAt" ASC
      LIMIT 5
    ` as LiveClassResult[]

    // Calculate revenue
    const totalRevenue = courses.reduce((sum, course) => {
      return sum + (course.enrollments * course.price)
    }, 0)

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEnrollments = await prisma.$queryRaw<EnrollmentResult[]>`
      SELECT id, "enrolledAt"
      FROM "Enrollment" e
      JOIN "Course" c ON e."courseId" = c.id
      WHERE c."teacherId" = ${teacherId} AND e."enrolledAt" >= ${thirtyDaysAgo.toISOString()}
      ORDER BY e."enrolledAt" DESC
    ` as EnrollmentResult[]

    // Top performing courses
    const topCourses = courses
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5)
      .map(course => ({
        id: course.id,
        title: course.title,
        enrollments: course.enrollments,
        revenue: course.enrollments * course.price,
      }))

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalCourses: courses.length,
          publishedCourses: courses.filter(c => c.modules > 0).length,
          totalStudents,
          totalRevenue,
          pendingSubmissions,
          upcomingClasses: upcomingClasses.length,
        },
        courses,
        upcomingClasses,
        recentEnrollments,
        topCourses,
      },
    })
  } catch (error) {
    console.error('Teacher dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
