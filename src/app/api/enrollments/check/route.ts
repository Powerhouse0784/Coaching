import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface StudentResult {
  id: string
}

interface EnrollmentResult {
  id: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ enrolled: false }, { status: 401 })
    }

    const { courseId } = await req.json()

    if (!courseId) {
      return NextResponse.json({ enrolled: false }, { status: 400 })
    }

    // Get student ID from session user (TYPED)
    const studentResults = await prisma.$queryRaw<StudentResult[]>`
      SELECT id FROM "Student" 
      WHERE "userId" = ${session.user.id}
    ` as StudentResult[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json({ enrolled: false })
    }

    const studentId = studentResults[0].id

    // Check if enrollment exists (TYPED)
    const enrollmentResults = await prisma.$queryRaw<EnrollmentResult[]>`
      SELECT id FROM "Enrollment" 
      WHERE "studentId" = ${studentId} AND "courseId" = ${courseId}
    ` as EnrollmentResult[]

    const enrolled = enrollmentResults && enrollmentResults.length > 0
    const enrollmentId = enrolled ? enrollmentResults[0].id : null

    return NextResponse.json({
      enrolled,
      enrollmentId
    })
  } catch (error) {
    console.error('Check enrollment error:', error)
    return NextResponse.json({ enrolled: false }, { status: 500 })
  }
}
