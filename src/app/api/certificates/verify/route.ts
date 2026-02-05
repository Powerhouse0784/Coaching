import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ✅ FIXED: params is now Promise<{ certNo: string }>
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certNo: string }> }
) {
  try {
    // ✅ FIXED: await params
    const { certNo } = await params

    // ✅ Use raw SQL - No Prisma model dependencies
    const certificateResult: any[] = await prisma.$queryRaw`
      SELECT 
        c.*,
        u.name as student_name,
        c2.title as course_title,
        t.name as instructor_name
      FROM "Certificate" c
      JOIN "User" u ON c."studentId" = u.id
      JOIN "Course" c2 ON c."courseId" = c2.id
      LEFT JOIN "Teacher" t ON c2."teacherId" = t.id
      WHERE c."certNo" = ${certNo}
      LIMIT 1
    `

    if (!certificateResult || certificateResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      )
    }

    const certificate = certificateResult[0]

    return NextResponse.json({
      success: true,
      data: {
        certNo: certificate.certNo,
        studentName: certificate.student_name,
        courseName: certificate.course_title,
        instructor: certificate.instructor_name || 'N/A',
        issueDate: certificate.createdAt || certificate.issuedAt,
        verified: true,
        studentId: certificate.studentId,
        courseId: certificate.courseId,
      },
    })

  } catch (error) {
    console.error('Verify certificate error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify certificate' },
      { status: 500 }
    )
  }
}