import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: { id: string }
}

interface DoubtResult {
  id: string
  title: string
  content: string
  studentId: string
  isSolved: boolean
  upvotes: number
  createdAt: Date
  studentName: string
  studentAvatar: string | null
}

interface ReplyResult {
  id: string
  content: string
  isAccepted: boolean
  createdAt: Date
  name: string
  avatar: string | null
  role: string
}

interface DoubtUpdateResult {
  id: string
  studentId: string
  upvotes: number
  isSolved: boolean
}

// GET /api/doubts/[id] - Get single doubt with replies
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

    // Get doubt with student info
    const doubtResults = await prisma.$queryRaw<DoubtResult[]>`
      SELECT 
        d.id, d.title, d.content, d."studentId", d."isSolved", 
        COALESCE(d.upvotes, 0) as upvotes, d."createdAt",
        s.name as studentName, s.avatar as studentAvatar
      FROM "doubt" d
      JOIN "Student" s ON d."studentId" = s.id
      WHERE d.id = ${id}
    `

    if (!doubtResults || doubtResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Doubt not found' },
        { status: 404 }
      )
    }

    const doubt = doubtResults[0]

    // Get replies with user info
    const repliesResults = await prisma.$queryRaw<ReplyResult[]>`
      SELECT 
        dr.id, dr.content, dr."isAccepted", dr."createdAt",
        u.name, u.avatar, u.role
      FROM "doubtReply" dr
      JOIN "User" u ON dr."userId" = u.id
      WHERE dr."doubtId" = ${id}
      ORDER BY dr."isAccepted" DESC, dr."createdAt" ASC
    `

    return NextResponse.json({
      success: true,
      data: {
        id: doubt.id,
        title: doubt.title,
        content: doubt.content,
        studentId: doubt.studentId,
        isSolved: doubt.isSolved,
        upvotes: Number(doubt.upvotes),
        createdAt: doubt.createdAt,
        student: {
          name: doubt.studentName,
          avatar: doubt.studentAvatar
        },
        replies: repliesResults
      },
    })
  } catch (error) {
    console.error('Get doubt error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doubt' },
      { status: 500 }
    )
  }
}

// PATCH /api/doubts/[id] - Update doubt (upvote, solve)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { action } = body // 'upvote', 'solve'

    // Get current doubt state
    const doubtResult = await prisma.$queryRaw<DoubtUpdateResult[]>`
      SELECT id, "studentId", COALESCE(upvotes, 0) as upvotes, "isSolved" 
      FROM "doubt" 
      WHERE id = ${id}
    `

    if (!doubtResult || doubtResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Doubt not found' },
        { status: 404 }
      )
    }

    const doubt = doubtResult[0]

    if (action === 'upvote') {
      await prisma.$executeRaw`
        UPDATE "doubt" 
        SET upvotes = upvotes + 1 
        WHERE id = ${id}
      `

      return NextResponse.json({
        success: true,
        data: { id, upvotes: Number(doubt.upvotes) + 1 },
      })
    }

    if (action === 'solve') {
      // Only student who posted can mark as solved
      if (doubt.studentId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      await prisma.$executeRaw`
        UPDATE "doubt" 
        SET "isSolved" = true 
        WHERE id = ${id}
      `

      return NextResponse.json({
        success: true,
        data: { id, isSolved: true },
        message: 'Doubt marked as solved',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update doubt error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update doubt' },
      { status: 500 }
    )
  }
}
