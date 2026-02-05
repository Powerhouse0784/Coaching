import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// Interfaces for raw query results
interface EnrollmentListResult {
  id: string
  studentId: string
  courseId: string
  enrolledAt: Date
  courseTitle: string
  courseThumbnail: string | null
  teacherName: string
  teacherAvatar: string | null
  totalModules: number
}

interface StudentResult {
  id: string
}

// GET /api/enrollments - Get user's enrollments with progress
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get student ID
    const studentResults = await prisma.$queryRaw<StudentResult[]>`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as StudentResult[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const studentId = studentResults[0].id

    // Get enrollments with course and teacher info
    const enrollments = await prisma.$queryRaw<EnrollmentListResult[]>`
      SELECT 
        e.id, e."studentId", e."courseId", e."enrolledAt",
        c.title as courseTitle, c.thumbnail as courseThumbnail,
        u.name as teacherName, u.avatar as teacherAvatar,
        COUNT(m.id) as totalModules
      FROM "Enrollment" e
      JOIN "Course" c ON e."courseId" = c.id
      JOIN "Teacher" t ON c."teacherId" = t.id
      JOIN "User" u ON t."userId" = u.id
      LEFT JOIN "Module" m ON c.id = m."courseId"
      WHERE e."studentId" = ${studentId}
      GROUP BY e.id, c.title, c.thumbnail, u.name, u.avatar
      ORDER BY e."enrolledAt" DESC
    ` as EnrollmentListResult[]

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get total lectures count
        const totalLecturesResult = await prisma.$queryRaw`
          SELECT COUNT(l.id)::int as total
          FROM "Lecture" l
          JOIN "Module" m ON l."moduleId" = m.id
          WHERE m."courseId" = ${enrollment.courseId}
        ` as any[]

        const totalLectures = Number(totalLecturesResult[0]?.total || 0)

        // Get completed lectures count
        const completedLecturesResult = await prisma.$queryRaw`
          SELECT COUNT(p.id)::int as completed
          FROM "Progress" p
          JOIN "Lecture" l ON p."lectureId" = l.id
          JOIN "Module" m ON l."moduleId" = m.id
          WHERE p."studentId" = ${studentId} 
          AND p."isCompleted" = true
          AND m."courseId" = ${enrollment.courseId}
        ` as any[]

        const completedLectures = Number(completedLecturesResult[0]?.completed || 0)

        const progressPercentage = totalLectures > 0 
          ? Math.round((completedLectures / totalLectures) * 100) 
          : 0

        return {
          ...enrollment,
          progress: {
            totalLectures,
            completedLectures,
            progressPercentage
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enrollmentsWithProgress,
    })
  } catch (error) {
    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Enroll in a course
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { courseId, paymentId } = await req.json()

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID required' },
        { status: 400 }
      )
    }

    // Get student
    const studentResults = await prisma.$queryRaw`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as any[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student profile not found' },
        { status: 404 }
      )
    }

    const studentId = studentResults[0].id

    // Check if already enrolled
    const existingEnrollment = await prisma.$queryRaw`
      SELECT id FROM "Enrollment" 
      WHERE "studentId" = ${studentId} AND "courseId" = ${courseId}
    ` as any[]

    if (existingEnrollment && existingEnrollment.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Get course details
    const courseResult = await prisma.$queryRaw`
      SELECT id, title FROM "Course" WHERE id = ${courseId}
    ` as any[]

    if (!courseResult || courseResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Create enrollment
    const enrollmentResult = await prisma.$queryRaw`
      INSERT INTO "Enrollment" ("studentId", "courseId") 
      VALUES (${studentId}, ${courseId})
      RETURNING *
    ` as any[]

    return NextResponse.json({
      success: true,
      data: enrollmentResult[0],
      course: { title: courseResult[0].title },
      message: 'Successfully enrolled in course!',
    })
  } catch (error) {
    console.error('Enrollment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enroll in course' },
      { status: 500 }
    )
  }
}