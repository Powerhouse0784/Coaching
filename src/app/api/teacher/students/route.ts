import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface TeacherResult {
  id: string
}

interface EnrollmentResult {
  id: string
  enrolledAt: string
  courseId: string
  studentId: string
  courseTitle: string
  studentName: string
  studentEmail: string
  studentAvatar: string | null
}

interface LectureResult {
  id: string
}

interface ModuleResult {
  lectures: LectureResult[]
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

    // Get students enrolled in teacher's courses
    let enrollmentWhere = `
      JOIN "Course" c ON e."courseId" = c.id 
      WHERE c."teacherId" = ${teacherId}
    `

    if (courseId) {
      enrollmentWhere += ` AND e."courseId" = ${courseId}`
    }

    const enrollments = await prisma.$queryRaw<EnrollmentResult[]>`
      SELECT 
        e.id,
        e."enrolledAt",
        e."courseId",
        e."studentId",
        c.title as "courseTitle",
        u.name as "studentName",
        u.email as "studentEmail",
        u.avatar as "studentAvatar"
      FROM "Enrollment" e
      JOIN "Student" s ON e."studentId" = s.id
      JOIN "User" u ON s."userId" = u.id
      ${enrollmentWhere}
      ORDER BY e."enrolledAt" DESC
    ` as EnrollmentResult[]

    // Calculate progress for each student
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment: EnrollmentResult) => {
        // Get total lectures for this course
        const courseLectures = await prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(l.id) as count
          FROM "Lecture" l
          JOIN "Module" m ON l."moduleId" = m.id
          WHERE m."courseId" = ${enrollment.courseId}
        ` as { count: number }[]

        const totalLectures = courseLectures[0]?.count || 0

        // Get completed lectures for this student in this course
        const completedLecturesResult = await prisma.$queryRaw<{ count: number }[]>`
          SELECT COUNT(p.id) as count
          FROM "Progress" p
          JOIN "Lecture" l ON p."lectureId" = l.id
          JOIN "Module" m ON l."moduleId" = m.id
          WHERE p."studentId" = ${enrollment.studentId} 
            AND m."courseId" = ${enrollment.courseId}
            AND p."isCompleted" = true
        ` as { count: number }[]

        const completedLectures = completedLecturesResult[0]?.count || 0

        const progressPercentage = totalLectures > 0
          ? Math.round((completedLectures / totalLectures) * 100)
          : 0

        return {
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt,
          courseId: enrollment.courseId,
          courseTitle: enrollment.courseTitle,
          student: {
            id: enrollment.studentId,
            name: enrollment.studentName,
            email: enrollment.studentEmail,
            avatar: enrollment.studentAvatar,
          },
          progress: {
            totalLectures,
            completedLectures,
            progressPercentage,
          },
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: studentsWithProgress,
    })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
