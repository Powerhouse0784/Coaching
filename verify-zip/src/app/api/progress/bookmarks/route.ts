import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface StudentResult {
  id: string
}

interface BookmarkResult {
  id: string
  timestamp: number
  note: string | null
  lectureTitle: string
  moduleTitle: string
  courseTitle: string
}

// GET /api/progress/bookmarks - Get student bookmarks
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

    // Get bookmarks with lecture/module/course info
    let whereClause = `WHERE b."studentId" = ${studentId}`
    if (lectureId) {
      whereClause += ` AND b."lectureId" = ${lectureId}`
    }

    const bookmarks = await prisma.$queryRaw<BookmarkResult[]>`
      SELECT 
        b.id, b.timestamp, b.note,
        l.title as lectureTitle,
        m.title as moduleTitle,
        c.title as courseTitle
      FROM "Bookmark" b
      JOIN "Lecture" l ON b."lectureId" = l.id
      JOIN "Module" m ON l."moduleId" = m.id
      JOIN "Course" c ON m."courseId" = c.id
      ${whereClause}
      ORDER BY b.timestamp ASC
    ` as BookmarkResult[]

    return NextResponse.json({
      success: true,
      data: bookmarks,
    })
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

// POST /api/progress/bookmarks - Create bookmark
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { lectureId, timestamp, note } = await req.json()

    if (!lectureId || timestamp === undefined) {
      return NextResponse.json(
        { success: false, error: 'Lecture ID and timestamp required' },
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

    // Create bookmark
    const bookmarkResult = await prisma.$queryRaw`
      INSERT INTO "Bookmark" (id, "studentId", "lectureId", timestamp, note, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${studentId},
        ${lectureId},
        ${Math.floor(timestamp)},
        ${note || null},
        NOW()
      )
      RETURNING id, "studentId", "lectureId", timestamp, note
    ` as any[]

    return NextResponse.json({
      success: true,
      data: bookmarkResult[0],
      message: 'Bookmark added successfully',
    })
  } catch (error) {
    console.error('Create bookmark error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}

// DELETE /api/progress/bookmarks - Delete bookmark
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const bookmarkId = searchParams.get('id')

    if (!bookmarkId) {
      return NextResponse.json(
        { success: false, error: 'Bookmark ID required' },
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

    // Delete bookmark (ownership verified)
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM "Bookmark" 
      WHERE id = ${bookmarkId} AND "studentId" = ${studentId}
    `

    if (deleteResult === 0) {
      return NextResponse.json(
        { success: false, error: 'Bookmark not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully',
    })
  } catch (error) {
    console.error('Delete bookmark error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
}
