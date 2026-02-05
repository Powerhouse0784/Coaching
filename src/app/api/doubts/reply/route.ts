import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface ReplyResult {
  id: string
  doubtId: string
  userId: string
  content: string
  isAccepted: boolean
  createdAt: Date
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { doubtId, content } = body

    if (!doubtId || !content) {
      return NextResponse.json(
        { success: false, error: 'Doubt ID and content required' },
        { status: 400 }
      )
    }

    // Use typed raw query to create reply
    const results = await prisma.$queryRaw<ReplyResult[]>`
      INSERT INTO "doubtReply" ("doubtId", "userId", "content", "createdAt") 
      VALUES (${doubtId}, ${session.user.id}, ${content}, NOW())
      RETURNING id, "doubtId", "userId", content, "isAccepted", "createdAt"
    `

    if (!results || results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create reply' },
        { status: 500 }
      )
    }

    const reply = results[0]

    return NextResponse.json({
      success: true,
      data: reply,
      message: 'Reply posted successfully',
    })
  } catch (error) {
    console.error('Create reply error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to post reply' },
      { status: 500 }
    )
  }
}
