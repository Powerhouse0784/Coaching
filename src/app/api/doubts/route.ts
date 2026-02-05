import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Interfaces for raw query results
interface DoubtListResult {
  id: string
  title: string
  content: string
  studentId: string
  isSolved: boolean
  upvotes: number
  createdAt: Date
  studentName: string
  studentAvatar: string | null
  replyCount: number
}

interface TotalResult {
  total: number
}

interface StudentResult {
  name: string
  avatar: string | null
}

// GET /api/doubts - Get all doubts
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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query dynamically
    let whereConditions = 'WHERE 1=1'
    
    if (courseId) {
      whereConditions += ` AND d."courseId" = '${courseId}'`
    }
    if (status === 'open') {
      whereConditions += ' AND d."isSolved" = false'
    }
    if (status === 'solved') {
      whereConditions += ' AND d."isSolved" = true'
    }

    const offset = (page - 1) * limit

    // Get paginated doubts
    const doubtsResults = await prisma.$queryRaw<DoubtListResult[]>`
      SELECT 
        d.id, d.title, d.content, d."studentId", d."isSolved", 
        COALESCE(d.upvotes, 0) as upvotes, d."createdAt",
        u.name as studentName, u.avatar as studentAvatar,
        COUNT(dr.id) as "replyCount"
      FROM "doubt" d
      JOIN "User" u ON d."studentId" = u.id
      LEFT JOIN "doubtReply" dr ON d.id = dr."doubtId"
      ${whereConditions}
      GROUP BY d.id, u.name, u.avatar
      ORDER BY d."isSolved" ASC, upvotes DESC, d."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as DoubtListResult[]

    // Get total count
    const totalResults = await prisma.$queryRaw<TotalResult[]>`
      SELECT COUNT(DISTINCT d.id)::int as total
      FROM "doubt" d
      ${whereConditions}
    ` as TotalResult[]

    const total = Number(totalResults[0]?.total || 0)

    return NextResponse.json({
      success: true,
      data: doubtsResults,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get doubts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch doubts' },
      { status: 500 }
    )
  }
}

// POST /api/doubts - Create doubt (Student only)
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
    const { title, description, courseId } = body

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description required' },
        { status: 400 }
      )
    }

    // Create doubt using raw SQL
    const result = await prisma.$queryRaw<DoubtListResult[]>`
      INSERT INTO "doubt" (id, title, content, "studentId", "courseId", "createdAt")
      VALUES (gen_random_uuid(), ${title}, ${description}, ${session.user.id}, ${courseId || null}, NOW())
      RETURNING id, title, content, "studentId", "courseId", "isSolved", upvotes, "createdAt"
    `

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create doubt' },
        { status: 500 }
      )
    }

    const doubt = result[0]

    // Get student info
    const studentResults = await prisma.$queryRaw<StudentResult[]>`
      SELECT name, avatar 
      FROM "User" 
      WHERE id = ${session.user.id}
    `

    return NextResponse.json({
      success: true,
      data: {
        ...doubt,
        student: studentResults[0] || { name: session.user.name || 'Student', avatar: null }
      },
      message: 'Doubt posted successfully',
    })
  } catch (error) {
    console.error('Create doubt error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to post doubt' },
      { status: 500 }
    )
  }
}