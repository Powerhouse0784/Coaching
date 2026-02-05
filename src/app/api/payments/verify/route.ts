import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

interface PaymentResult {
  id: string
  razorpayId: string
  courseId: string
  amount: number
  status: string
}

interface StudentResult {
  id: string
}

interface EnrollmentResult {
  id: string
  courseId: string
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      )
    }

    // Verify Razorpay signature (secure server-side verification)
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`)
    const signature = shasum.digest('hex')

    const isValid = signature === razorpay_signature

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Find payment record
    const paymentResults = await prisma.$queryRaw<PaymentResult[]>`
      SELECT id, razorpayId, "courseId", amount, status 
      FROM "Payment" 
      WHERE "razorpayId" = ${razorpay_order_id}
    ` as PaymentResult[]

    const payment = paymentResults[0]

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      )
    }

    // Update payment status to success
    await prisma.$executeRaw`
      UPDATE "Payment" 
      SET status = 'success'
      WHERE id = ${payment.id}
    `

    // Get student
    const studentResults = await prisma.$queryRaw<StudentResult[]>`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as StudentResult[]

    if (!studentResults || studentResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    const studentId = studentResults[0].id

    // Check if already enrolled
    const existingEnrollment = await prisma.$queryRaw`
      SELECT id FROM "Enrollment" 
      WHERE "studentId" = ${studentId} AND "courseId" = ${payment.courseId}
    ` as any[]

    if (existingEnrollment && existingEnrollment.length > 0) {
      return NextResponse.json({
        success: true,
        data: { enrollmentId: existingEnrollment[0].id },
        message: 'Payment verified, already enrolled!',
      })
    }

    // Create enrollment
    const enrollmentResult = await prisma.$queryRaw<EnrollmentResult[]>`
      INSERT INTO "Enrollment" ("studentId", "courseId") 
      VALUES (${studentId}, ${payment.courseId})
      RETURNING id, "courseId"
    ` as EnrollmentResult[]

    const enrollment = enrollmentResult[0]

    // Get course title for response
    const courseResult = await prisma.$queryRaw`
      SELECT title FROM "Course" WHERE id = ${payment.courseId}
    ` as any[]

    return NextResponse.json({
      success: true,
      data: {
        enrollmentId: enrollment.id,
        courseTitle: courseResult[0]?.title || 'Course'
      },
      message: 'Payment verified and enrolled successfully!',
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
