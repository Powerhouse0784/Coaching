// app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import Razorpay from "razorpay";

// ── Fee Plans config ──
export const FEE_PLANS = [
  { id: "cls10-math",    class: "Class 10", subject: "Mathematics", price: 900,  originalPrice: 1200, duration: "3 Months", popular: false },
  { id: "cls10-sci",     class: "Class 10", subject: "Science",     price: 900,  originalPrice: 1200, duration: "3 Months", popular: false },
  { id: "cls10-eng",     class: "Class 10", subject: "English",     price: 700,  originalPrice: 999,  duration: "3 Months", popular: false },
  { id: "cls10-sst",     class: "Class 10", subject: "Social Sc.",  price: 700,  originalPrice: 999,  duration: "3 Months", popular: false },
  { id: "cls10-all",     class: "Class 10", subject: "All Subjects",price: 2999, originalPrice: 4796, duration: "3 Months", popular: true  },
  { id: "cls11-math",    class: "Class 11", subject: "Mathematics", price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-phy",     class: "Class 11", subject: "Physics",     price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-chem",    class: "Class 11", subject: "Chemistry",   price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-bio",     class: "Class 11", subject: "Biology",     price: 1100, originalPrice: 1499, duration: "3 Months", popular: false },
  { id: "cls11-all",     class: "Class 11", subject: "All Subjects",price: 3499, originalPrice: 5996, duration: "3 Months", popular: true  },
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

export const HARDCOPY_PRICE = 30;

// ── Helper function to generate payment proof HTML ──
function getPaymentProofHtml(paymentProofUrl: string | null): string {
  if (!paymentProofUrl) return '';
  
  return `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
      <h3 style="margin-top: 0; color: #1f2937;">📸 Payment Proof</h3>
      <p style="margin-bottom: 10px;">Customer has uploaded a payment screenshot:</p>
      <a href="${paymentProofUrl}" target="_blank" style="display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; margin: 10px 0;">
        🔍 View Payment Screenshot
      </a>
      <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">The image will open in a new tab</p>
    </div>
  `;
}

// ── Email function using Brevo API ──
async function sendEmailViaBrevo(
  to: string,
  toName: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      sender: {
        name: "Intense Learners",
        email: process.env.EMAIL_FROM || "saquibnadeem0@gmail.com",
      },
      to: [{ email: to, name: toName }],
      replyTo: {
        email: process.env.EMAIL_FROM || "saquibnadeem0@gmail.com",
        name: "Intense Learners",
      },
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Brevo API error ${response.status}: ${errorBody}`);
    throw new Error(`Brevo API error ${response.status}`);
  }
}

// Helper function to send order notification
async function sendOrderNotification(
  to: string,
  toName: string,
  orderId: string,
  total: number,
  items: any[],
  address: any,
  paymentMethod: string | null,
  isAdmin: boolean = false,
  paymentProofUrl: string | null = null
) {
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}${item.qty ? ` × ${item.qty}` : ''}${item.unitPrice ? ` @ ₹${item.unitPrice}` : ''}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const addressHtml = address ? `
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">Delivery Address</h3>
      <p style="margin: 5px 0;"><strong>${address.name}</strong></p>
      <p style="margin: 5px 0;">${address.address}</p>
      <p style="margin: 5px 0;">${address.city}, ${address.state || 'N/A'} - ${address.pincode}</p>
      <p style="margin: 5px 0;">Phone: ${address.phone}</p>
      ${address.landmark ? `<p style="margin: 5px 0;">Landmark: ${address.landmark}</p>` : ''}
    </div>
  ` : '';

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  const paymentMethodDisplay = paymentMethod === 'qr' ? 'QR Code Payment (UPI)' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending';
  const paymentMethodColor = paymentMethod === 'qr' ? '#7c3aed' : paymentMethod === 'cod' ? '#10b981' : '#f59e0b';
  const paymentMethodIcon = paymentMethod === 'qr' ? '📱' : paymentMethod === 'cod' ? '💵' : '⏳';
  
  const paymentProofHtml = isAdmin && paymentMethod === 'qr' && paymentProofUrl
    ? getPaymentProofHtml(paymentProofUrl)
    : '';
  
  const emailSubject = isAdmin 
    ? `🛍️ New Order #${orderId.slice(0, 8)} - ${paymentMethodDisplay} - Action Required`
    : `🎉 Order Confirmation #${orderId.slice(0, 8)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${isAdmin ? 'New Order' : 'Order Confirmation'}</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Intense Learners</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Learn with Intensity</p>
        </div>

        <div style="padding: 40px;">
          <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 12px;">
            ${isAdmin ? '🛍️ New Order Received!' : '🎉 Order Received!'}
          </h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">
            Hi <strong style="color: #111827;">${toName}</strong>,
          </p>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            ${isAdmin 
              ? `A new order has been placed and requires your review.`
              : `Thank you for your order! Your order has been received and is pending admin approval.`}
          </p>

          <div style="background: ${paymentMethodColor}10; border: 2px solid ${paymentMethodColor}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${paymentMethodColor};">
              ${paymentMethodIcon} Payment Method: ${paymentMethodDisplay}
            </p>
            ${isAdmin && paymentMethod === 'cod' ? '<p style="margin: 8px 0 0; font-size: 12px; color: #92400e;">⚠️ Cash on Delivery - Verify customer details before approving</p>' : ''}
            ${isAdmin && paymentMethod === 'qr' ? '<p style="margin: 8px 0 0; font-size: 12px; color: #92400e;">📱 QR Payment - Check payment proof before approving</p>' : ''}
          </div>

          <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px;"><strong>Order ID:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold;">${orderId}</span></p>
            <p style="margin: 0;"><strong>Total Amount:</strong> <span style="color: #4f46e5; font-size: 18px; font-weight: 700;">₹${total.toLocaleString('en-IN')}</span></p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 12px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHtml}
              <tr style="font-weight: bold; border-top: 2px solid #e5e7eb;">
                <td style="padding: 12px 8px 0 8px;">Total</td>
                <td style="padding: 12px 8px 0 8px; text-align: right;">₹${total.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          ${addressHtml}
          
          ${paymentProofHtml}

          ${isAdmin ? `
            <div style="margin-top: 24px; text-align: center;">
              <a href="${baseUrl}/api/payments?action=approve-order&orderId=${orderId}" 
                 style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 0 8px; font-weight: 600;">
                ✅ Approve Order
              </a>
              <a href="${baseUrl}/api/payments?action=reject-order&orderId=${orderId}" 
                 style="display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 0 8px; font-weight: 600;">
                ❌ Reject Order
              </a>
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 16px;">
              Click the buttons above to approve or reject this order.
            </p>
          ` : `
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                ⏳ Your order is pending admin approval. You will receive another email once it's confirmed.
              </p>
            </div>
            <div style="background: #e0e7ff; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; color: #3730a3; font-size: 14px;">
                📝 Save your Order ID for tracking: <strong style="font-family: monospace;">${orderId}</strong>
              </p>
            </div>
          `}
        </div>

        <div style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #f3f4f6;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Intense Learners · All rights reserved
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Order ${orderId}\nPayment Method: ${paymentMethodDisplay}\nTotal: ₹${total.toLocaleString('en-IN')}\n\nItems:\n${items.map((item: any) => `- ${item.name}: ₹${item.price}`).join('\n')}`;

  await sendEmailViaBrevo(to, toName, emailSubject, html, text);
}

// Razorpay instance
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET Handler
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    let orderId = searchParams.get("orderId");

    // Handle approve/reject from email links
    if ((action === "approve-order" || action === "reject-order") && orderId) {
      const newStatus = action === "approve-order" ? "approved" : "rejected";
      
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      const paymentMethodDisplay = order.paymentMethod === 'qr' ? 'QR Code Payment' : order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending';
      const subject = newStatus === 'approved' 
        ? `✅ Order #${order.id.slice(0, 8)} Approved!` 
        : `❌ Order #${order.id.slice(0, 8)} Update`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Order ${newStatus === 'approved' ? 'Approved' : 'Update'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${newStatus === 'approved' ? '#10b981' : '#ef4444'}; color: white; padding: 20px; text-align: center; border-radius: 10px;">
            <h1 style="margin: 0;">Order ${newStatus === 'approved' ? 'Approved! ✅' : 'Update'}</h1>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${order.userName || 'Customer'},</p>
            <p>Your order <strong>#${order.id.slice(0, 8)}</strong> has been <strong>${newStatus}</strong>.</p>
            <p><strong>Payment Method:</strong> ${paymentMethodDisplay}</p>
            ${newStatus === 'approved' 
              ? '<p>Your order will be processed and delivered soon.</p>' 
              : '<p>Please contact support for more information or to resolve any issues.</p>'}
            <p>Thank you for choosing Intense Learners!</p>
          </div>
        </body>
        </html>
      `;

      await sendEmailViaBrevo(
        order.userEmail,
        order.userName || 'Customer',
        subject,
        html,
        `Your order ${order.id} has been ${newStatus}`
      );

      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order ${newStatus === 'approved' ? 'Approved' : 'Rejected'}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f3f4f6; }
            .container { text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            h1 { color: ${newStatus === 'approved' ? '#10b981' : '#ef4444'}; }
            code { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Order ${newStatus === 'approved' ? 'Approved! ✅' : 'Rejected ❌'}</h1>
            <p>Order <code>${order.id}</code> has been ${newStatus}.</p>
            <p>The customer has been notified via email.</p>
            <a href="${process.env.NEXTAUTH_URL}/admin/orders" style="color: #4f46e5;">Go to Admin Panel</a>
          </div>
        </body>
        </html>
      `, { status: 200, headers: { 'Content-Type': 'text/html' } });
    }

    // Fee plans
    if (action === "fee-plans") {
      return NextResponse.json({ success: true, plans: FEE_PLANS });
    }

    // Notes for hardcopy
    if (action === "notes") {
      try {
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
            price: true,
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
      } catch (error) {
        console.error("Notes fetch error:", error);
        return NextResponse.json({ success: true, notes: [] });
      }
    }

    // Order status tracking
    if (action === "order-status") {
      if (!orderId || orderId.trim().length === 0) {
        return NextResponse.json({ error: "orderId required" }, { status: 400 });
      }

      let order = null;
      order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (!order && orderId.length >= 8) {
        const orders = await prisma.order.findMany({
          where: { id: { startsWith: orderId } },
          take: 1,
        });
        order = orders[0] || null;
      }

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    // Admin orders
    if (action === "admin-orders" && session?.user?.email === process.env.ADMIN_EMAIL) {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, orders });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[payments GET]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // JSON requests
    const body = await req.json();
    const { action } = body;

    // ── Validate coupon ──
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

    // ── Update payment proof (from UploadThing) ──
    if (action === "update-payment-proof") {
      const { orderId, proofUrl } = body;
      
      if (!orderId || !proofUrl) {
        return NextResponse.json({ error: "Missing orderId or proofUrl" }, { status: 400 });
      }
      
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { paymentProof: proofUrl },
      });
      
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const proofHtml = getPaymentProofHtml(proofUrl);
      
      await sendEmailViaBrevo(
        process.env.ADMIN_EMAIL || 'saquibnadeem0@gmail.com',
        'Admin',
        `💰 Payment Proof Uploaded - Order #${orderId.slice(0, 8)}`,
        `<h2>💰 Payment Proof Uploaded</h2>
         <p><strong>Order ID:</strong> ${orderId}</p>
         <p><strong>Customer:</strong> ${order.userName || order.userEmail}</p>
         <p><strong>Amount:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
         <p><strong>Payment Method:</strong> QR Code Payment</p>
         ${proofHtml}
         <div style="margin-top: 20px; text-align: center;">
           <a href="${baseUrl}/api/payments?action=approve-order&orderId=${orderId}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">✅ Approve Order</a>
           <a href="${baseUrl}/api/payments?action=reject-order&orderId=${orderId}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">❌ Reject Order</a>
         </div>`,
        `Payment proof uploaded for order ${orderId}\nView at: ${proofUrl}`
      );
      
      return NextResponse.json({ success: true });
    }

    // ── Create order (QR/COD) ──
    if (action === "create-order") {
      const { items, subtotal, couponDiscount, total, couponCode, address, userEmail, paymentMethod } = body;

      const email = session?.user?.email || userEmail;
      
      if (!email) {
        return NextResponse.json({ error: "User email required" }, { status: 401 });
      }

      const order = await prisma.order.create({
        data: {
          userId: session?.user?.id || null,
          items: items,
          subtotal,
          couponDiscount: couponDiscount || 0,
          total,
          couponCode: couponCode || null,
          address: address || null,
          paymentMethod: paymentMethod,
          status: 'pending',
          userEmail: email,
          userName: address?.name || session?.user?.name || null,
          userPhone: address?.phone || null,
        },
      });

      await sendOrderNotification(
        email,
        address?.name || session?.user?.name || 'Customer',
        order.id,
        total,
        items,
        address,
        paymentMethod,
        false,
        null
      );

      await sendOrderNotification(
        process.env.ADMIN_EMAIL || 'saquibnadeem0@gmail.com',
        'Admin',
        order.id,
        total,
        items,
        address,
        paymentMethod,
        true,
        null
      );

      console.log(`✅ Order created: ${order.id} for ${email} | Payment: ${paymentMethod}`);

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[payments POST]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}