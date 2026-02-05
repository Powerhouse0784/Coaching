import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text() // Raw text for signature verification
    const signature = req.headers.get('x-razorpay-signature') || ''

    // Verify webhook signature (UNCOMMENTED & FIXED)
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    shasum.update(body)
    const expectedSignature = shasum.digest('hex')

    if (signature !== expectedSignature) {
      console.log('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Parse body as JSON
    const payload = JSON.parse(body)
    const event = payload.event

    console.log(`Webhook received: ${event}`)

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity
      const orderId = paymentEntity.order_id

      // Update payment status to success using raw SQL
      await prisma.$executeRaw`
        UPDATE "Payment" 
        SET status = 'success'
        WHERE "razorpayId" = ${orderId}
      `

      console.log(`Payment captured: ${orderId}`)

    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload.payment.entity
      const orderId = paymentEntity.order_id

      // Update payment status to failed
      await prisma.$executeRaw`
        UPDATE "Payment" 
        SET status = 'failed'
        WHERE "razorpayId" = ${orderId}
      `

      console.log(`Payment failed: ${orderId}`)

    } else {
      console.log(`Unhandled webhook event: ${event}`)
    }

    // Always return 200 to acknowledge webhook
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
