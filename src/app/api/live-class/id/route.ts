import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: { id: string }
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

    // Use raw query to avoid model issues
    const liveClassResult = await prisma.$queryRaw`
      SELECT 
        lc.*,
        b.name as batch_name,
        t."userId" as teacher_user_id,
        u.name as teacher_name,
        u.avatar as teacher_avatar
      FROM "LiveClass" lc
      JOIN "Batch" b ON lc."batchId" = b.id
      JOIN "Teacher" t ON lc."teacherId" = t.id
      JOIN "User" u ON t."userId" = u.id
      WHERE lc.id = ${id}
    `

    if (!liveClassResult || (liveClassResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Live class not found' },
        { status: 404 }
      )
    }

    const liveClass = (liveClassResult as any[])[0]

    // Check if user is enrolled or is the teacher (STUDENT check)
    if (session.user.role === 'STUDENT') {
      const studentResult = await prisma.$queryRaw`
        SELECT s.id 
        FROM "Student" s 
        WHERE s."userId" = ${session.user.id}
      `
      
      if (!studentResult || (studentResult as any[]).length === 0) {
        return NextResponse.json(
          { success: false, error: 'Student not found' },
          { status: 404 }
        )
      }

      const studentId = (studentResult as any[])[0].id

      const enrollmentResult = await prisma.$queryRaw`
        SELECT e.id
        FROM "Enrollment" e
        JOIN "Course" c ON e."courseId" = c.id
        JOIN "_CourseToBatch" cb ON c.id = cb."A"
        WHERE e."studentId" = ${studentId} 
        AND cb."B" = ${liveClass.batchId}
      `

      if (!enrollmentResult || (enrollmentResult as any[]).length === 0) {
        return NextResponse.json(
          { success: false, error: 'Not enrolled in this batch' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: liveClass.id,
        title: liveClass.title,
        batchId: liveClass.batchId,
        batch: { name: liveClass.batch_name },
        teacherId: liveClass.teacherId,
        teacher: {
          user: {
            id: liveClass.teacher_user_id,
            name: liveClass.teacher_name,
            avatar: liveClass.teacher_avatar
          }
        },
        scheduledAt: liveClass.scheduledAt,
        duration: liveClass.duration,
        meetingUrl: liveClass.meetingUrl,
        status: liveClass.status,
        isLive: liveClass.isLive
      },
    })
  } catch (error) {
    console.error('Get live class error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live class' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { action } = body

    const liveClassCheck = await prisma.$queryRaw`
      SELECT id FROM "LiveClass" WHERE id = ${id}
    `

    if (!liveClassCheck || (liveClassCheck as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Live class not found' },
        { status: 404 }
      )
    }

    if (action === 'start') {
      await prisma.$queryRaw`
        UPDATE "LiveClass" 
        SET "isLive" = true 
        WHERE id = ${id}
      `
    } else if (action === 'end') {
      await prisma.$queryRaw`
        UPDATE "LiveClass" 
        SET "isLive" = false 
        WHERE id = ${id}
      `
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Class ${action}ed successfully`,
    })
  } catch (error) {
    console.error('Update live class error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update live class' },
      { status: 500 }
    )
  }
}
