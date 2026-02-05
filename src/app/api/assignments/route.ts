import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/assignments - Get assignments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') // 'pending', 'submitted', 'evaluated'

    if (session.user.role === 'STUDENT') {
      // Get student
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

      // Get student's assignments
      let whereClause = `AND e."studentId" = ${studentId}`

      if (courseId) {
        whereClause += ` AND a."courseId" = ${courseId}`
      }

      const assignments = await prisma.$queryRaw`
        SELECT 
          a.id, a.title, a.description, a."dueDate", a."maxMarks", a."fileUrl",
          tu.name as "teacherName", tu.avatar as "teacherAvatar",
          s.id as "submissionId", s."submittedAt", s."isEvaluated", s.marks
        FROM "Assignment" a
        JOIN "Teacher" t ON a."teacherId" = t.id
        JOIN "User" tu ON t."userId" = tu.id
        JOIN "Course" c ON a."courseId" = c.id 
        JOIN "Enrollment" e ON c.id = e."courseId"
        LEFT JOIN "AssignmentSubmission" s ON a.id = s."assignmentId" AND s."studentId" = ${studentId}
        WHERE e."studentId" = ${studentId}
        ${courseId ? `AND a."courseId" = ${courseId}` : ``}
        ORDER BY a."dueDate" ASC
      ` as any[]

      // Group by assignment and filter by status
      const assignmentMap: any = {}
      assignments.forEach((row: any) => {
        if (!assignmentMap[row.id]) {
          assignmentMap[row.id] = {
            id: row.id,
            title: row.title,
            description: row.description,
            dueDate: row.dueDate,
            maxMarks: row.maxMarks,
            fileUrl: row.fileUrl,
            teacher: {
              name: row.teacherName,
              avatar: row.teacherAvatar
            },
            submissions: []
          }
        }
        if (row.submissionId) {
          assignmentMap[row.id].submissions.push({
            id: row.submissionId,
            submittedAt: row.submittedAt,
            isEvaluated: row.isEvaluated,
            marks: row.marks
          })
        }
      })

      let filteredAssignments = Object.values(assignmentMap)
      if (status === 'pending') {
        filteredAssignments = filteredAssignments.filter((a: any) => a.submissions.length === 0)
      } else if (status === 'submitted') {
        filteredAssignments = filteredAssignments.filter((a: any) => 
          a.submissions.length > 0 && !a.submissions[0]?.isEvaluated
        )
      } else if (status === 'evaluated') {
        filteredAssignments = filteredAssignments.filter((a: any) => 
          a.submissions.length > 0 && a.submissions[0]?.isEvaluated
        )
      }

      return NextResponse.json({
        success: true,
        data: filteredAssignments,
      })
    } else if (session.user.role === 'TEACHER') {
      // Get teacher
      const teacherResults = await prisma.$queryRaw`
        SELECT id FROM "Teacher" WHERE "userId" = ${session.user.id}
      ` as any[]

      if (!teacherResults || teacherResults.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Teacher not found' },
          { status: 404 }
        )
      }

      const teacherId = teacherResults[0].id

      // Get teacher's assignments with submission counts
      const assignments = await prisma.$queryRaw`
        SELECT 
          a.id, a.title, a.description, a."dueDate", a."maxMarks", a."courseId",
          COUNT(s.id) as "submissionCount"
        FROM "Assignment" a
        LEFT JOIN "AssignmentSubmission" s ON a.id = s."assignmentId"
        WHERE a."teacherId" = ${teacherId}
        GROUP BY a.id, a.title, a.description, a."dueDate", a."maxMarks", a."courseId"
        ORDER BY a."dueDate" DESC
      ` as any[]

      return NextResponse.json({
        success: true,
        data: assignments,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST /api/assignments - Create assignment (Teacher only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher
    const teacherResults = await prisma.$queryRaw`
      SELECT id FROM "Teacher" WHERE "userId" = ${session.user.id}
    ` as any[]

    if (!teacherResults || teacherResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher profile not found' },
        { status: 404 }
      )
    }

    const teacherId = teacherResults[0].id
    const body = await req.json()
    const { title, description, totalMarks, dueDate, courseId, fileUrl } = body

    if (!title || !description || !totalMarks || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignmentResult = await prisma.$queryRaw`
      INSERT INTO "Assignment" (
        id, title, description, "totalMarks", "dueDate", 
        "teacherId", "courseId", "fileUrl", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        ${title},
        ${description},
        ${parseInt(totalMarks)},
        ${dueDate},
        ${teacherId},
        ${courseId || null},
        ${fileUrl || null},
        NOW()
      )
      RETURNING id, title, description, "totalMarks", "dueDate", "courseId"
    ` as any[]

    return NextResponse.json({
      success: true,
      data: assignmentResult[0],
      message: 'Assignment created successfully',
    })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}