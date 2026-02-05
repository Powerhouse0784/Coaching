import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Coupon code required' },
        { status: 400 }
      )
    }

    // Find coupon using raw query (bypasses model issues)
    const couponResults = await prisma.$queryRaw<CouponResult[]>`
      SELECT code, discount, "isPercentage", "isActive", "validFrom", "validUntil", "maxUses", "usedCount"
      FROM "Coupon" 
      WHERE code = ${code.toUpperCase()}
    ` as CouponResult[]

    const coupon = couponResults[0]

    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code' },
        { status: 400 }
      )
    }

    const now = new Date()
    if (coupon.validFrom > now || coupon.validUntil < now) {
      return NextResponse.json(
        { success: false, error: 'Coupon has expired' },
        { status: 400 }
      )
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Coupon usage limit reached' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        discount: coupon.discount,
        isPercentage: coupon.isPercentage,
      },
      message: 'Coupon applied successfully',
    })
  } catch (error) {
    console.error('Validate coupon error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
