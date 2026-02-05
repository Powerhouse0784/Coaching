import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface StudentResult {
  id: string
}

interface ProgressResult {
  watchedSeconds: number
  isCompleted: boolean
  lastWatchedAt: string | null
}

// GET /api/progress?lectureId=xxx - Get progress for a lecture
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
    const lectureId = searchParams.get('lectureId')

    if (!lectureId) {
      return NextResponse.json(
        { success: false, error: 'Lecture ID required' },
        { status: 400 }
      )
    }

    // Get student ID
    const studentResults = await prisma.$queryRaw<StudentResult[]>`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as StudentResult[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentId = studentResults[0].id

    // Get progress for lecture
    const progressResults = await prisma.$queryRaw<ProgressResult[]>`
      SELECT 
        "watchedSeconds",
        "isCompleted",
        "lastWatchedAt"
      FROM "Progress" 
      WHERE "studentId" = ${studentId} AND "lectureId" = ${lectureId}
    ` as ProgressResult[]

    const progress = progressResults[0] || {
      watchedSeconds: 0,
      isCompleted: false,
      lastWatchedAt: null,
    }

    return NextResponse.json({
      success: true,
      data: progress,
    })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

// POST /api/progress - Update video progress
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { lectureId, watchedSeconds, totalDuration } = await req.json()

    if (!lectureId || watchedSeconds === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get student ID
    const studentResults = await prisma.$queryRaw<StudentResult[]>`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as StudentResult[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentId = studentResults[0].id

    // Calculate if completed (watched > 90% of video)
    const isCompleted = totalDuration 
      ? watchedSeconds >= totalDuration * 0.9 
      : false

    // Check if progress exists
    const existingProgress = await prisma.$queryRaw`
      SELECT id FROM "Progress" 
      WHERE "studentId" = ${studentId} AND "lectureId" = ${lectureId}
    ` as any[]

    if (existingProgress.length > 0) {
      // UPDATE existing progress
      await prisma.$executeRaw`
        UPDATE "Progress" 
        SET 
          "watchedSeconds" = ${watchedSeconds},
          "isCompleted" = ${isCompleted},
          "lastWatchedAt" = NOW()
        WHERE "studentId" = ${studentId} AND "lectureId" = ${lectureId}
      `
    } else {
      // INSERT new progress
      await prisma.$executeRaw`
        INSERT INTO "Progress" (id, "studentId", "lectureId", "watchedSeconds", "isCompleted", "lastWatchedAt", "createdAt")
        VALUES (
          gen_random_uuid(),
          ${studentId},
          ${lectureId},
          ${watchedSeconds},
          ${isCompleted},
          NOW(),
          NOW()
        )
      `
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        lectureId,
        watchedSeconds,
        isCompleted,
        lastWatchedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Update progress error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}
