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

    // Raw query for teacher
    const teacherResult = await prisma.$queryRaw`
      SELECT id FROM "Teacher" 
      WHERE "userId" = ${session.user.id}
    `

    if (!teacherResult || (teacherResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    const teacherId = (teacherResult as any[])[0].id

    const body = await req.json()
    const { title, batchId, scheduledAt, duration } = body

    if (!title || !batchId || !scheduledAt || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique meeting URL
    const roomName = `class-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const meetingUrl = `https://your-domain.daily.co/${roomName}`

    // Create live class using raw SQL
    const liveClassResult = await prisma.$queryRaw`
      INSERT INTO "LiveClass" (
        title, 
        "batchId", 
        "teacherId", 
        "scheduledAt", 
        duration, 
        "meetingUrl", 
        status,
        createdAt
      ) VALUES (
        ${title},
        ${batchId},
        ${teacherId},
        ${new Date(scheduledAt)},
        ${parseInt(duration)},
        ${meetingUrl},
        'SCHEDULED',
        NOW()
      ) RETURNING id, title, "batchId", "teacherId", "scheduledAt", duration, "meetingUrl", status, createdAt
    `

    const liveClassId = (liveClassResult as any[])[0].id

    // Fetch with relations manually
    const liveClassWithRelations = await prisma.$queryRaw`
      SELECT 
        lc.*,
        b.name as batch_name
      FROM "LiveClass" lc
      JOIN "Batch" b ON lc."batchId" = b.id
      WHERE lc.id = ${liveClassId}
    `

    const liveClassData = (liveClassWithRelations as any[])[0]

    return NextResponse.json({
      success: true,
      data: {
        id: liveClassData.id,
        title: liveClassData.title,
        batchId: liveClassData.batchId,
        batch: { name: liveClassData.batch_name },
        teacherId: liveClassData.teacherId,
        scheduledAt: liveClassData.scheduledAt,
        duration: liveClassData.duration,
        meetingUrl: liveClassData.meetingUrl,
        status: liveClassData.status,
        createdAt: liveClassData.createdAt
      },
      message: 'Live class scheduled successfully',
    })
  } catch (error) {
    console.error('Create live class error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create live class' },
      { status: 500 }
    )
  }
}
