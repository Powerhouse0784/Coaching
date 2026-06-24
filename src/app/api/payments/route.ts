// app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

// ── Fee Plans ──────────────────────────────────────────────────────────────────
export const FEE_PLANS = [
  // Class 5
  { id: "cls5-math",  class: "Class 5",  subject: "Mathematics", price: 400,  originalPrice: 699,  duration: "1 Month", popular: false },
  { id: "cls5-eng",   class: "Class 5",  subject: "English",     price: 400,  originalPrice: 699,  duration: "1 Month", popular: false },
  { id: "cls5-sci",   class: "Class 5",  subject: "Science",     price: 400,  originalPrice: 699,  duration: "1 Month", popular: false },
  { id: "cls5-sst",   class: "Class 5",  subject: "Social Sc.",  price: 400,  originalPrice: 699,  duration: "1 Month", popular: false },
  { id: "cls5-all",   class: "Class 5",  subject: "All Subjects",price: 1400, originalPrice: 2796, duration: "1 Month", popular: true  },

  // Class 6
  { id: "cls6-math",  class: "Class 6",  subject: "Mathematics", price: 450,  originalPrice: 749,  duration: "1 Month", popular: false },
  { id: "cls6-eng",   class: "Class 6",  subject: "English",     price: 450,  originalPrice: 749,  duration: "1 Month", popular: false },
  { id: "cls6-sci",   class: "Class 6",  subject: "Science",     price: 450,  originalPrice: 749,  duration: "1 Month", popular: false },
  { id: "cls6-sst",   class: "Class 6",  subject: "Social Sc.",  price: 450,  originalPrice: 749,  duration: "1 Month", popular: false },
  { id: "cls6-all",   class: "Class 6",  subject: "All Subjects",price: 1600, originalPrice: 2996, duration: "1 Month", popular: true  },

  // Class 7
  { id: "cls7-math",  class: "Class 7",  subject: "Mathematics", price: 500,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls7-eng",   class: "Class 7",  subject: "English",     price: 500,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls7-sci",   class: "Class 7",  subject: "Science",     price: 500,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls7-sst",   class: "Class 7",  subject: "Social Sc.",  price: 500,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls7-all",   class: "Class 7",  subject: "All Subjects",price: 1800, originalPrice: 3196, duration: "1 Month", popular: true  },

  // Class 8
  { id: "cls8-math",  class: "Class 8",  subject: "Mathematics", price: 550,  originalPrice: 899,  duration: "1 Month", popular: false },
  { id: "cls8-eng",   class: "Class 8",  subject: "English",     price: 550,  originalPrice: 899,  duration: "1 Month", popular: false },
  { id: "cls8-sci",   class: "Class 8",  subject: "Science",     price: 550,  originalPrice: 899,  duration: "1 Month", popular: false },
  { id: "cls8-sst",   class: "Class 8",  subject: "Social Sc.",  price: 550,  originalPrice: 899,  duration: "1 Month", popular: false },
  { id: "cls8-all",   class: "Class 8",  subject: "All Subjects",price: 2000, originalPrice: 3596, duration: "1 Month", popular: true  },

  // Class 9
  { id: "cls9-math",  class: "Class 9",  subject: "Mathematics", price: 600,  originalPrice: 999,  duration: "1 Month", popular: false },
  { id: "cls9-eng",   class: "Class 9",  subject: "English",     price: 600,  originalPrice: 999,  duration: "1 Month", popular: false },
  { id: "cls9-sci",   class: "Class 9",  subject: "Science",     price: 600,  originalPrice: 999,  duration: "1 Month", popular: false },
  { id: "cls9-sst",   class: "Class 9",  subject: "Social Sc.",  price: 600,  originalPrice: 999,  duration: "1 Month", popular: false },
  { id: "cls9-all",   class: "Class 9",  subject: "All Subjects",price: 2200, originalPrice: 3996, duration: "1 Month", popular: true  },

  // Class 10
  { id: "cls10-math", class: "Class 10", subject: "Mathematics", price: 700,  originalPrice: 1200, duration: "1 Month", popular: false },
  { id: "cls10-sci",  class: "Class 10", subject: "Science",     price: 700,  originalPrice: 1200, duration: "1 Month", popular: false },
  { id: "cls10-eng",  class: "Class 10", subject: "English",     price: 700,  originalPrice: 999,  duration: "1 Month", popular: false },
  { id: "cls10-sst",  class: "Class 10", subject: "Social Sc.",  price: 700,  originalPrice: 999,  duration: "1 Month", popular: false },
  { id: "cls10-all",  class: "Class 10", subject: "All Subjects",price: 2500, originalPrice: 4398, duration: "1 Month", popular: true  },

  // Class 11
  { id: "cls11-math", class: "Class 11", subject: "Mathematics", price: 900,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls11-phy",  class: "Class 11", subject: "Physics",     price: 900,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls11-chem", class: "Class 11", subject: "Chemistry",   price: 900,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls11-bio",  class: "Class 11", subject: "Biology",     price: 900,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls11-all",  class: "Class 11", subject: "Any 4 Subjects",price: 3300, originalPrice: 5596, duration: "1 Month", popular: true },

  // Class 12
  { id: "cls12-math", class: "Class 12", subject: "Mathematics", price: 1000, originalPrice: 1499, duration: "1 Month", popular: false },
  { id: "cls12-phy",  class: "Class 12", subject: "Physics",     price: 1000, originalPrice: 1499, duration: "1 Month", popular: false },
  { id: "cls12-chem", class: "Class 12", subject: "Chemistry",   price: 1000, originalPrice: 1499, duration: "1 Month", popular: false },
  { id: "cls12-bio",  class: "Class 12", subject: "Biology",     price: 1000, originalPrice: 1499, duration: "1 Month", popular: false },
  { id: "cls12-all",  class: "Class 12", subject: "Any 4 Subjects",price: 3700, originalPrice: 6796, duration: "1 Month", popular: true },
];

export const COUPONS: Record<string, { type: "percent" | "flat"; value: number; label: string; minOrder: number }> = {
  SAVE20:   { type: "percent", value: 20,  label: "20% off on all orders",         minOrder: 500  },
  FLAT100:  { type: "flat",    value: 100, label: "₹100 off on orders above ₹500", minOrder: 500  },
  NEWJOIN:  { type: "percent", value: 15,  label: "15% off for new students",      minOrder: 0    },
  INTENSEL: { type: "percent", value: 25,  label: "25% off — exclusive code",      minOrder: 1000 },
};

// ── Email helpers ──────────────────────────────────────────────────────────────
function getPaymentProofHtml(proofUrl: string | null): string {
  if (!proofUrl) return '';
  return `
    <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;text-align:center;">
      <h3 style="margin-top:0;color:#1f2937;">📸 Payment Proof</h3>
      <a href="${proofUrl}" target="_blank" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;margin:10px 0;">
        🔍 View Payment Screenshot
      </a>
    </div>`;
}

async function sendEmailViaBrevo(to: string, toName: string, subject: string, html: string, text: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY! },
    body: JSON.stringify({
      sender: { name: "Intense Learners", email: process.env.BREVO_SENDER_EMAIL || "saquibnadeem0@gmail.com" },
      to: [{ email: to, name: toName }],
      replyTo: { email: process.env.BREVO_SENDER_EMAIL || "saquibnadeem0@gmail.com", name: "Intense Learners" },
      subject, htmlContent: html, textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
}

async function sendOrderNotification(
  to: string, toName: string, orderId: string, total: number,
  items: any[], address: any, paymentMethod: string | null,
  isAdmin = false, paymentProofUrl: string | null = null
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://intense-learners.vercel.app/';
  const pmDisplay = paymentMethod === 'qr' ? 'QR Code Payment (UPI)' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending';
  const pmColor  = paymentMethod === 'qr' ? '#7c3aed' : paymentMethod === 'cod' ? '#10b981' : '#f59e0b';
  const pmIcon   = paymentMethod === 'qr' ? '📱' : paymentMethod === 'cod' ? '💵' : '⏳';

  const itemsHtml = items.map((i: any) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i.name}${i.qty ? ` × ${i.qty}` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${i.price.toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const addressHtml = address ? `
    <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
      <h3 style="margin-top:0;color:#1f2937;">Delivery Address</h3>
      <p style="margin:5px 0;"><strong>${address.name}</strong></p>
      <p style="margin:5px 0;">${address.address}</p>
      <p style="margin:5px 0;">${address.city} - ${address.pincode}</p>
      <p style="margin:5px 0;">Phone: ${address.phone}</p>
    </div>` : '';

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;">Intense Learners</h1>
      </div>
      <div style="padding:30px;">
        <h2 style="color:#111827;">${isAdmin ? '🛍️ New Order Received!' : '🎉 Order Received!'}</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p>${isAdmin ? 'A new order needs your review.' : 'Thank you! Your order is pending admin approval.'}</p>
        <div style="background:${pmColor}10;border:2px solid ${pmColor};border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
          <strong style="color:${pmColor};">${pmIcon} ${pmDisplay}</strong>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Order ID:</strong> <code>${orderId}</code></p>
          <p style="margin:4px 0;"><strong>Total:</strong> <span style="color:#4f46e5;font-size:18px;font-weight:700;">₹${total.toLocaleString('en-IN')}</span></p>
        </div>
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}
          <tr style="font-weight:bold;"><td style="padding:12px 8px 0;">Total</td><td style="padding:12px 8px 0;text-align:right;">₹${total.toLocaleString('en-IN')}</td></tr>
        </table>
        ${addressHtml}
        ${isAdmin && paymentProofUrl ? getPaymentProofHtml(paymentProofUrl) : ''}
        ${isAdmin ? `
          <div style="margin-top:24px;text-align:center;">
            <a href="${baseUrl}/api/payments?action=approve-order&orderId=${orderId}" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:0 8px;font-weight:600;">✅ Approve</a>
            <a href="${baseUrl}/api/payments?action=reject-order&orderId=${orderId}" style="background:#ef4444;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:0 8px;font-weight:600;">❌ Reject</a>
          </div>` : `
          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#92400e;">⏳ Pending admin approval. Save your Order ID: <strong><code>${orderId}</code></strong></p>
          </div>`}
      </div>
    </div>
  </body></html>`;

  await sendEmailViaBrevo(to, toName, isAdmin ? `🛍️ New Order #${orderId.slice(0,8)}` : `🎉 Order Confirmation #${orderId.slice(0,8)}`, html,
    `Order ${orderId} | Payment: ${pmDisplay} | Total: ₹${total}`);
}

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const orderId = searchParams.get("orderId");

    // Email approve/reject links
    if ((action === "approve-order" || action === "reject-order") && orderId) {
      const newStatus = action === "approve-order" ? "approved" : "rejected";
      const order = await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });

      await sendEmailViaBrevo(
        order.userEmail, order.userName || 'Customer',
        newStatus === 'approved' ? `✅ Order #${order.id.slice(0,8)} Approved!` : `❌ Order #${order.id.slice(0,8)} Update`,
        `<h2>Order ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2><p>Order <strong>${order.id}</strong> has been <strong>${newStatus}</strong>.</p><p>${newStatus === 'approved' ? 'Your order will be processed soon.' : 'Please contact support.'}</p>`,
        `Your order ${order.id} has been ${newStatus}`
      );

      return new NextResponse(`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f3f4f6;">
        <div style="text-align:center;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <h1 style="color:${newStatus === 'approved' ? '#10b981' : '#ef4444'};">Order ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h1>
          <p>Order <code>${order.id}</code> has been ${newStatus}. Customer notified.</p>
        </div></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    if (action === "fee-plans") return NextResponse.json({ success: true, plans: FEE_PLANS });

    if (action === "notes") {
      const notes = await prisma.note.findMany({
        where: { isPublished: true },
        select: {
          id: true, title: true, description: true, subject: true, class: true,
          topic: true, chapter: true, fileName: true, fileType: true, fileSize: true,
          thumbnailUrl: true, isPinned: true, downloads: true, views: true, price: true,
          teacher: { select: { user: { select: { name: true, avatar: true } } } },
        },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      });
      return NextResponse.json({
        success: true,
        notes: notes.map(n => ({ ...n, teacher: { name: n.teacher.user.name, avatar: n.teacher.user.avatar } })),
      });
    }

    if (action === "order-status" && orderId) {
      // Try exact match first, then prefix match
      let order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order && orderId.length >= 8) {
        const rows = await prisma.order.findMany({ where: { id: { startsWith: orderId } }, take: 1 });
        order = rows[0] || null;
      }
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ success: true, order });
    }

    if (action === "admin-orders" && session?.user?.email === process.env.ADMIN_EMAIL) {
      const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
      return NextResponse.json({ success: true, orders });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[payments GET]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { action } = body;

    if (action === "validate-coupon") {
      const { code, subtotal } = body;
      const upper = (code as string).toUpperCase().trim();
      const coupon = COUPONS[upper];
      if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      if (subtotal < coupon.minOrder) return NextResponse.json({ error: `Minimum order ₹${coupon.minOrder} required` }, { status: 400 });
      const discount = coupon.type === "percent" ? Math.floor(subtotal * coupon.value / 100) : Math.min(coupon.value, subtotal);
      return NextResponse.json({ success: true, discount, label: coupon.label, code: upper });
    }

    if (action === "update-payment-proof") {
      const { orderId, proofUrl } = body;
      if (!orderId || !proofUrl) return NextResponse.json({ error: "Missing orderId or proofUrl" }, { status: 400 });
      const order = await prisma.order.update({ where: { id: orderId }, data: { paymentProof: proofUrl } });
      const baseUrl = process.env.NEXTAUTH_URL || 'https://intense-learners.vercel.app/';
      await sendEmailViaBrevo(
        process.env.ADMIN_EMAIL || 'saquibnadeem0@gmail.com', 'Admin',
        `💰 Payment Proof Uploaded - Order #${orderId.slice(0,8)}`,
        `<h2>💰 Payment Proof Uploaded</h2><p><strong>Order:</strong> ${orderId}</p><p><strong>Customer:</strong> ${order.userName || order.userEmail}</p><p><strong>Amount:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
         ${getPaymentProofHtml(proofUrl)}
         <div style="margin-top:20px;text-align:center;">
           <a href="${baseUrl}/api/payments?action=approve-order&orderId=${orderId}" style="background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-right:10px;">✅ Approve</a>
           <a href="${baseUrl}/api/payments?action=reject-order&orderId=${orderId}" style="background:#ef4444;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">❌ Reject</a>
         </div>`,
        `Payment proof for order ${orderId}: ${proofUrl}`
      );
      return NextResponse.json({ success: true });
    }

    if (action === "create-order") {
      const { items, subtotal, couponDiscount, total, couponCode, address, userEmail, paymentMethod } = body;
      const email = session?.user?.email || userEmail;
      if (!email) return NextResponse.json({ error: "User email required" }, { status: 401 });

      const order = await prisma.order.create({
        data: {
          userId: session?.user?.id || null,
          items, subtotal,
          couponDiscount: couponDiscount || 0,
          total,
          couponCode: couponCode || null,
          address: address || null,
          paymentMethod,
          status: 'pending',
          userEmail: email,
          userName: address?.name || session?.user?.name || null,
          userPhone: address?.phone || null,
        },
      });

      // Send both emails in parallel
      await Promise.allSettled([
        sendOrderNotification(email, address?.name || session?.user?.name || 'Customer', order.id, total, items, address, paymentMethod, false, null),
        sendOrderNotification(process.env.ADMIN_EMAIL || 'saquibnadeem0@gmail.com', 'Admin', order.id, total, items, address, paymentMethod, true, null),
      ]);

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[payments POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}