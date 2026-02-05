import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET /api/courses - Get all courses with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const level = searchParams.get('level') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Fixed: Use simple static queries with minimal dynamic parts
    const baseQuery = `
      SELECT 
        c.id, c.title, c.description, c.price, c.slug, c.level, c.language, c.thumbnail,
        tu.name as "teacherName", tu.avatar as "teacherAvatar",
        cat.name as "categoryName",
        COUNT(e.id) as "enrollments_count",
        COUNT(m.id) as "modules_count"
      FROM "Course" c
      JOIN "Teacher" t ON c."teacherId" = t.id
      JOIN "User" tu ON t."userId" = tu.id
      LEFT JOIN "Category" cat ON c."categoryId" = cat.id
      LEFT JOIN "Enrollment" e ON c.id = e."courseId"
      LEFT JOIN "Module" m ON c."courseId" = m."courseId"
      WHERE c."isPublished" = true
    `

    let finalQuery = baseQuery
    const params: any[] = []

    // Add filters as parameters
    if (search) {
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`)
      finalQuery += ` AND (LOWER(c.title) LIKE $${params.length - 1} OR LOWER(c.description) LIKE $${params.length})`
    }
    
    if (category) {
      params.push(category)
      finalQuery += ` AND cat.slug = $${params.length}`
    }
    
    if (level) {
      params.push(level)
      finalQuery += ` AND c.level = $${params.length}`
    }

    // Add sorting
    let orderBy = `ORDER BY c."createdAt" DESC`
    if (sortBy === 'popular') orderBy = `ORDER BY "enrollments_count" DESC`
    else if (sortBy === 'price-low') orderBy = `ORDER BY c.price ASC`
    else if (sortBy === 'price-high') orderBy = `ORDER BY c.price DESC`

    params.push(limit, (page - 1) * limit)
    
    // Get paginated courses
    const courses = await prisma.$queryRaw`
      ${finalQuery}
      GROUP BY c.id, c.title, c.description, c.price, c.slug, c.level, c.language, 
               c.thumbnail, tu.name, tu.avatar, cat.name
      ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    ` as any[]

    // Get total count (simplified)
    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM "Course" c 
      WHERE c."isPublished" = true
    ` as any[]

    const total = totalResult[0]?.count || 0

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create new course (Teacher only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, description, price, level, language, categoryId, thumbnail } = body

    if (!title || !description || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
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

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      + '-' + Date.now()

    // Create course
    await prisma.$executeRaw`
      INSERT INTO "Course" (
        id, title, slug, description, price, level, language, thumbnail,
        "teacherId", "categoryId", "isPublished", "createdAt"
      )
      VALUES (
        gen_random_uuid(),
        ${title},
        ${slug},
        ${description},
        ${parseFloat(price)},
        ${level || 'Beginner'},
        ${language || 'English'},
        ${thumbnail || null},
        ${teacherId},
        ${categoryId || null},
        false,
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      data: {
        title,
        slug,
        description,
        price: parseFloat(price),
        level: level || 'Beginner',
        language: language || 'English',
        teacherId,
        categoryId: categoryId || null,
      },
      message: 'Course created successfully',
    })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
