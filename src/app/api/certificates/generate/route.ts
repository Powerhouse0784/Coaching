import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// ✅ FIXED: NO authOptions import + Proper session typing + Pure raw SQL
const generateCertificateNumber = (): string => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `CERT-${year}-${random}`
}

interface SessionUser {
  id: string
  role: string
  name?: string
}

interface Session {
  user: SessionUser
}

export async function POST(req: NextRequest) {
  try {
    // ✅ FIXED: Proper session typing without authOptions
    const session = await getServerSession() as Session | null

    // ✅ FIXED: Safe session.user access
    if (!session?.user?.id || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID required' },
        { status: 400 }
      )
    }

    // Get student info from User table
    const studentResult: any[] = await prisma.$queryRaw`
      SELECT id, name FROM "User" 
      WHERE id = ${userId}::text 
      AND "role" = 'STUDENT'
      LIMIT 1
    `

    if (!studentResult || studentResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const student = studentResult[0]
    const studentId = student.id

    // Get all lecture IDs for the course
    const courseLecturesResult: any[] = await prisma.$queryRaw`
      SELECT json_agg(l.id) as lecture_ids
      FROM "Course" c
      JOIN "Module" m ON c.id = m."courseId" 
      JOIN "Lecture" l ON m.id = l."moduleId"
      WHERE c.id = ${courseId}
      GROUP BY c.id
    `

    if (!courseLecturesResult || courseLecturesResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    const allLectureIds = courseLecturesResult[0].lecture_ids || []
    const totalLectures = allLectureIds.length

    // Get completed lectures count
    const completionResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*)::int as completed_count
      FROM "LectureProgress" lp
      WHERE lp."studentId" = ${studentId}
      AND lp."lectureId"::text = ANY(${allLectureIds}::text[])
      AND lp.status = 'COMPLETED'
    `

    const completedLectures = completionResult[0]?.completed_count || 0
    const completionPercentage = totalLectures > 0 
      ? (completedLectures / totalLectures) * 100 
      : 0

    // Check 80% completion
    if (completionPercentage < 80) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Only ${Math.round(completionPercentage)}% complete. Need 80% for certificate.`,
          completionPercentage: Math.round(completionPercentage * 10) / 10,
          totalLectures,
          completedLectures
        },
        { status: 400 }
      )
    }

    // Check existing certificate
    const existingCert: any[] = await prisma.$queryRaw`
      SELECT * FROM "Certificate" 
      WHERE "studentId" = ${studentId} 
      AND "courseId" = ${courseId}
      LIMIT 1
    `

    if (existingCert.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingCert[0],
        message: 'Certificate already generated',
      })
    }

    // Generate certificate
    const certNumber = generateCertificateNumber()
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${certNumber}`

    // Create certificate record
    await prisma.$executeRaw`
      INSERT INTO "Certificate" ("studentId", "courseId", "certNo", "createdAt")
      VALUES (${studentId}, ${courseId}, ${certNumber}, NOW())
    `

    return NextResponse.json({
      success: true,
      data: {
        id: crypto.randomUUID(),
        certNo: certNumber,
        studentId,
        courseId,
        studentName: student.name || 'Student',
        verificationUrl,
        completionPercentage: Math.round(completionPercentage * 10) / 10,
        totalLectures,
        completedLectures,
        createdAt: new Date().toISOString()
      },
      message: 'Certificate generated successfully!',
    })

  } catch (error) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}
