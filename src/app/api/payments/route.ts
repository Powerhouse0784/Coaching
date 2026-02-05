import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

interface CourseResult {
  id: string
  title: string
  price: number
}

interface CouponResult {
  code: string
  discount: number
  isPercentage: boolean
  isActive: boolean
  validFrom: Date
  validUntil: Date
  maxUses: number | null
  usedCount: number
}

interface RazorpayOrder {
  id: string
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
    const { courseId, couponCode } = body

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID required' },
        { status: 400 }
      )
    }

    // Get course details
    const courseResults = await prisma.$queryRaw<CourseResult[]>`
      SELECT id, title, price FROM "Course" WHERE id = ${courseId}
    ` as CourseResult[]

    const course = courseResults[0]

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if already enrolled
    const studentResults = await prisma.$queryRaw`
      SELECT id FROM "Student" WHERE "userId" = ${session.user.id}
    ` as any[]

    let isAlreadyEnrolled = false
    if (studentResults && studentResults.length > 0) {
      const studentId = studentResults[0].id
      const existingEnrollment = await prisma.$queryRaw`
        SELECT id FROM "Enrollment" 
        WHERE "studentId" = ${studentId} AND "courseId" = ${courseId}
      ` as any[]

      isAlreadyEnrolled = existingEnrollment && existingEnrollment.length > 0
    }

    if (isAlreadyEnrolled) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    // Calculate final amount with coupon
    let finalAmount = course.price
    let discount = 0

    if (couponCode) {
      const couponResults = await prisma.$queryRaw<CouponResult[]>`
        SELECT code, discount, "isPercentage", "isActive", "validFrom", "validUntil", "maxUses", "usedCount"
        FROM "Coupon" WHERE code = ${couponCode.toUpperCase()}
      ` as CouponResult[]

      const coupon = couponResults[0]

      if (coupon && coupon.isActive) {
        const now = new Date()
        if (
          coupon.validFrom <= now &&
          coupon.validUntil >= now &&
          (!coupon.maxUses || coupon.usedCount < coupon.maxUses)
        ) {
          discount = coupon.isPercentage
            ? (finalAmount * coupon.discount) / 100
            : coupon.discount
          finalAmount = Math.max(0, finalAmount - discount)
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid or expired coupon' },
            { status: 400 }
          )
        }
      }
    }

    // Create Razorpay order using fetch (no external lib needed)
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: Math.round(finalAmount * 100), // paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        payment_capture: 1
      })
    })

    const orderData = await razorpayResponse.json()
    
    if (!orderData.id) {
      return NextResponse.json(
        { success: false, error: 'Failed to create Razorpay order' },
        { status: 500 }
      )
    }

    const order: RazorpayOrder = { id: orderData.id }

    // Create payment record
    await prisma.$executeRaw`
      INSERT INTO "Payment" (id, "userId", amount, currency, status, "razorpayId", "courseId", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${session.user.id},
        ${finalAmount},
        'INR',
        'pending',
        ${order.id},
        ${courseId},
        NOW()
      )
    `

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: finalAmount,
        currency: 'INR',
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        courseName: course.title,
        discount,
      },
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
