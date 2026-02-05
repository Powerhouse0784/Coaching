import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// ✅ FIXED: params is now Promise<{ id: string }>
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ FIXED: await params
    const { id } = await params

    // Get course with all details
    const courseResults = await prisma.$queryRaw`
      SELECT 
        c.id, c.title, c.description, c.price, c."isPublished",
        tu.name as "teacherName", tu.avatar as "teacherAvatar",
        cat.name as "categoryName",
        COUNT(e.id) as "enrollmentCount"
      FROM "Course" c
      JOIN "Teacher" t ON c."teacherId" = t.id
      JOIN "User" tu ON t."userId" = tu.id
      LEFT JOIN "Category" cat ON c."categoryId" = cat.id
      LEFT JOIN "Enrollment" e ON c.id = e."courseId"
      WHERE c.id = ${id}
      GROUP BY c.id, c.title, c.description, c.price, c."isPublished", 
               tu.name, tu.avatar, cat.name
    ` as any[]

    const course = courseResults[0]
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get modules and lectures
    const modules = await prisma.$queryRaw`
      SELECT 
        m.id, m.title, m.order as "moduleOrder",
        l.id as "lectureId", l.title as "lectureTitle", 
        l.duration, l.order as "lectureOrder", l."isFree"
      FROM "Module" m
      LEFT JOIN "Lecture" l ON m.id = l."moduleId"
      WHERE m."courseId" = ${id}
      ORDER BY m.order ASC, l.order ASC
    ` as any[]

    // Group modules with lectures
    const courseWithModules = {
      ...course,
      modules: modules.reduce((acc: any[], row: any) => {
        const moduleIndex = acc.findIndex(m => m.id === row.id)
        if (moduleIndex === -1) {
          acc.push({
            id: row.id,
            title: row.title,
            order: row.moduleOrder,
            lectures: row.lectureId ? [{
              id: row.lectureId,
              title: row.lectureTitle,
              duration: row.duration,
              order: row.lectureOrder,
              isFree: row.isFree
            }] : []
          })
        } else if (row.lectureId) {
          acc[moduleIndex].lectures.push({
            id: row.lectureId,
            title: row.lectureTitle,
            duration: row.duration,
            order: row.lectureOrder,
            isFree: row.isFree
          })
        }
        return acc
      }, [])
    }

    return NextResponse.json({
      success: true,
      data: courseWithModules,
    })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PATCH /api/courses/:id - Update course (Teacher only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ FIXED: await params
    const { id } = await params
    const body = await req.json()

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

    // Check ownership
    const courseCheck = await prisma.$queryRaw`
      SELECT id FROM "Course" WHERE id = ${id} AND "teacherId" = ${teacherId}
    ` as any[]

    if (courseCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course not found or unauthorized' },
        { status: 403 }
      )
    }

    // Update course
    const allowedFields = ['title', 'description', 'price', 'isPublished']
    const updateFields: any = {}
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateFields[field] = body[field]
      }
    })

    await prisma.$executeRaw`
      UPDATE "Course" 
      SET ${Object.entries(updateFields).map(([key, value]: any) => 
        `"${key}" = ${value}`
      ).join(', ')},
      "updatedAt" = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
    })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/:id - Delete course (Teacher only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ FIXED: await params
    const { id } = await params

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

    // Check ownership and delete
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM "Course" 
      WHERE id = ${id} AND "teacherId" = ${teacherId}
    `

    if (deleteResult === 0) {
      return NextResponse.json(
        { success: false, error: 'Course not found or unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}