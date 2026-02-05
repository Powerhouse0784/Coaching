import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Raw query for student
    const studentResult = await prisma.$queryRaw`
      SELECT id FROM "Student" 
      WHERE "userId" = ${session.user.id}
    `

    if (!studentResult || (studentResult as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentId = (studentResult as any[])[0].id

    // Check if already marked
    const existingResult = await prisma.$queryRaw`
      SELECT * FROM "Attendance" 
      WHERE "studentId" = ${studentId} AND "liveClassId" = ${id}
    `

    if (existingResult && (existingResult as any[]).length > 0) {
      return NextResponse.json({
        success: true,
        data: (existingResult as any[])[0],
        message: 'Attendance already marked',
      })
    }

    // Mark attendance using raw SQL
    const attendanceResult = await prisma.$queryRaw`
      INSERT INTO "Attendance" (
        "studentId", 
        "liveClassId", 
        "isPresent", 
        "createdAt"
      ) VALUES (
        ${studentId},
        ${id},
        true,
        NOW()
      ) RETURNING *
    `

    return NextResponse.json({
      success: true,
      data: (attendanceResult as any[])[0],
      message: 'Attendance marked',
    })
  } catch (error) {
    console.error('Mark attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}
