import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface RouteParams {
  params: {
    id: string
  }
}

interface ReplyData {
  studentId: string
  doubtId: string
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Use prisma.$queryRaw with proper typing
    const replyResults = await prisma.$queryRaw<
      ReplyData[]
    >`
      SELECT d.studentId, d.id as doubtId 
      FROM "doubtReply" dr 
      JOIN "doubt" d ON dr."doubtId" = d.id 
      WHERE dr.id = ${id}
    `

    if (!replyResults || replyResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reply not found' },
        { status: 404 }
      )
    }

    const replyData = replyResults[0]

    // Only student who posted the doubt can accept answer
    if (replyData.studentId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Unaccept all other replies and accept this one
    await prisma.$executeRaw`
      UPDATE "doubtReply" 
      SET "isAccepted" = false 
      WHERE "doubtId" = ${replyData.doubtId}
    `

    await prisma.$executeRaw`
      UPDATE "doubtReply" 
      SET "isAccepted" = true 
      WHERE id = ${id}
    `

    // Mark doubt as solved
    await prisma.$executeRaw`
      UPDATE "doubt" 
      SET "isSolved" = true 
      WHERE id = ${replyData.doubtId}
    `

    return NextResponse.json({
      success: true,
      data: { id, isAccepted: true },
      message: 'Answer accepted',
    })
  } catch (error) {
    console.error('Accept answer error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept answer' },
      { status: 500 }
    )
  }
}
