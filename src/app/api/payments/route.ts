// app/api/payments/route.ts
// Handles: GET fee-plans, POST create-order, POST verify-payment, POST hardcopy-order
 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import Razorpay from "razorpay";
 
// ── Razorpay instance ─────────────────────────────────────────────────────────
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}
 
// ── Fee Plans config (class-wise & subject-wise) ──────────────────────────────
// You can move this to DB later. For now it's config-driven.
export const FEE_PLANS = [
  // Class 10
  { id: "cls10-math",    class: "Class 10", subject: "Mathematics", price: 900,  originalPrice: 1200, duration: "3 Months", popular: false },
  { id: "cls10-sci",     class: "Class 10", subject: "Science",     price: 900,  originalPrice: 1200, duration: "3 Months", popular: false },
  { id: "cls10-eng",     class: "Class 10", subject: "English",     price: 700,  originalPrice: 999,  duration: "3 Months", popular: false },
  { id: "cls10-sst",     class: "Class 10", subject: "Social Sc.",  price: 700,  originalPrice: 999,  duration: "3 Months", popular: false },
  { id: "cls10-all",     class: "Class 10", subject: "All Subjects",price: 2999, originalPrice: 4796, duration: "3 Months", popular: true  },
  // Class 11
  { id: "cls11-math",    class: "Class 11", subject: "Mathematics", price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-phy",     class: "Class 11", subject: "Physics",     price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-chem",    class: "Class 11", subject: "Chemistry",   price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-bio",     class: "Class 11", subject: "Biology",     price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-all",     class: "Class 11", subject: "All Subjects",price: 3499, originalPrice: 5996, duration: "3 Months", popular: true  },
  // Class 12
  { id: "cls12-math",    class: "Class 12", subject: "Mathematics", price: 1200, originalPrice: 1699, duration: "3 Months", popular: false },
  { id: "cls12-phy",     class: "Class 12", subject: "Physics",     price: 1200, originalPrice: 1699, duration: "3 Months", popular: false },
  { id: "cls12-chem",    class: "Class 12", subject: "Chemistry",   price: 1200, originalPrice: 1699, duration: "3 Months", popular: false },
  { id: "cls12-bio",     class: "Class 12", subject: "Biology",     price: 1200, originalPrice: 1699, duration: "3 Months", popular: false },
  { id: "cls12-all",     class: "Class 12", subject: "All Subjects",price: 3999, originalPrice: 6796, duration: "3 Months", popular: true  },
];
 
export const COUPONS: Record<string, { type: "percent" | "flat"; value: number; label: string; minOrder: number }> = {
  SAVE20:   { type: "percent", value: 20,  label: "20% off on all orders",       minOrder: 500  },
  FLAT100:  { type: "flat",    value: 100, label: "₹100 off on orders above ₹500", minOrder: 500  },
  NEWJOIN:  { type: "percent", value: 15,  label: "15% off for new students",    minOrder: 0    },
  INTENSEL: { type: "percent", value: 25,  label: "25% off — exclusive code",    minOrder: 1000 },
};
 
export const HARDCOPY_PRICE = 30; // ₹30 per copy
 
// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/payments?action=fee-plans
// GET  /api/payments?action=notes         → returns notes from DB for hardcopy
// GET  /api/payments?action=order-status&orderId=xxx
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
 
    // ── Fee plans ──
    if (action === "fee-plans") {
      return NextResponse.json({ success: true, plans: FEE_PLANS });
    }
 
    // ── Notes available for hardcopy (from real DB) ──
    if (action === "notes") {
      const notes = await prisma.note.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          class: true,
          topic: true,
          chapter: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          thumbnailUrl: true,
          isPinned: true,
          downloads: true,
          views: true,
          teacher: {
            select: {
              user: { select: { name: true, avatar: true } },
            },
          },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });
 
      const formatted = notes.map((n) => ({
        ...n,
        teacher: { name: n.teacher.user.name, avatar: n.teacher.user.avatar },
      }));
 
      return NextResponse.json({ success: true, notes: formatted });
    }
 
    // ── Order status ──
    if (action === "order-status") {
      const orderId = searchParams.get("orderId");
      if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
 
      const order = await prisma.paymentOrder.findUnique({
        where: { orderId },
        include: { items: true },
      });
 
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ success: true, order });
    }
 
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
 
  } catch (error) {
    console.error("[payments GET]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments
// body.action = "create-order" | "verify-payment" | "validate-coupon"
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
 
    const body = await req.json();
    const { action } = body;
 
    // ── Validate coupon ──────────────────────────────────────────────────────
    if (action === "validate-coupon") {
      const { code, subtotal } = body;
      const upper = (code as string).toUpperCase().trim();
      const coupon = COUPONS[upper];
 
      if (!coupon) {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }
      if (subtotal < coupon.minOrder) {
        return NextResponse.json({ error: `Minimum order ₹${coupon.minOrder} required for this coupon` }, { status: 400 });
      }
 
      const discount = coupon.type === "percent"
        ? Math.floor(subtotal * coupon.value / 100)
        : Math.min(coupon.value, subtotal);
 
      return NextResponse.json({ success: true, discount, label: coupon.label, code: upper });
    }
 
    // ── Create Razorpay order ────────────────────────────────────────────────
    if (action === "create-order") {
      const { items, couponCode, deliveryAddress, subtotal } = body;
      // items = [{ type: 'fee'|'hardcopy', id: string, qty?: number, price: number, name: string }]
 
      // Recompute total server-side (never trust client total)
      let serverSubtotal = 0;
      for (const item of items) {
        if (item.type === "fee") {
          const plan = FEE_PLANS.find((p) => p.id === item.id);
          if (!plan) return NextResponse.json({ error: `Invalid plan: ${item.id}` }, { status: 400 });
          serverSubtotal += plan.price;
        } else if (item.type === "hardcopy") {
          const qty = item.qty || 1;
          serverSubtotal += HARDCOPY_PRICE * qty;
        }
      }
 
      // Apply coupon server-side
      let couponDiscount = 0;
      let appliedCoupon = null;
      if (couponCode) {
        const upper = couponCode.toUpperCase().trim();
        const coupon = COUPONS[upper];
        if (coupon && serverSubtotal >= coupon.minOrder) {
          couponDiscount = coupon.type === "percent"
            ? Math.floor(serverSubtotal * coupon.value / 100)
            : Math.min(coupon.value, serverSubtotal);
          appliedCoupon = upper;
        }
      }
 
      const totalAmount = Math.max(serverSubtotal - couponDiscount, 0);
 
      // Create Razorpay order
      const razorpay = getRazorpay();
      const rzpOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          studentEmail: session.user.email,
          coupon: appliedCoupon || "none",
        },
      });
 
      // Get user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
 
      // Save order to DB (you'll need to add PaymentOrder model — schema below)
      // For now we just return the Razorpay order. Add DB model when ready.
      console.log(`[payments] Order created for ${session.user.email}: ₹${totalAmount}`);
 
      return NextResponse.json({
        success: true,
        data: {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          orderId: rzpOrder.id,
          amount: totalAmount,
          currency: "INR",
          description: `Intense Learners — ${items.length} item(s)`,
          prefillEmail: session.user.email,
          prefillName: session.user.name || "",
        },
      });
    }
 
    // ── Verify Razorpay payment ──────────────────────────────────────────────
    if (action === "verify-payment") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, deliveryAddress, couponCode } = body;
 
      // Verify signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
 
      if (expectedSignature !== razorpay_signature) {
        console.error("[payments] Signature mismatch");
        return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
      }
 
      // Get user
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, student: { select: { id: true } } },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
 
      // Process each item
      for (const item of items) {
        if (item.type === "fee") {
          // Mark enrollment or store fee payment
          console.log(`[payments] Fee plan ${item.id} purchased by ${session.user.email}`);
          // TODO: Create enrollment record when you have a FeePlan model in Prisma
        }
        if (item.type === "hardcopy") {
          // Store hardcopy order
          console.log(`[payments] Hardcopy of note ${item.id} × ${item.qty} ordered by ${session.user.email}`);
          // TODO: Create HardcopyOrder record when you have that model
        }
      }
 
      console.log(`[payments] Payment verified: ${razorpay_payment_id}`);
 
      return NextResponse.json({
        success: true,
        paymentId: razorpay_payment_id,
        message: "Payment successful",
      });
    }
 
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
 
  } catch (error) {
    console.error("[payments POST]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}