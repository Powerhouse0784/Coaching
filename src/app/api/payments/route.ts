// app/api/payments/route.ts
//
// Security model (this route moves real money, so nothing here trusts the client):
//  - create-order      signed-in users only. Prices are recomputed on the server from FEE_PLANS / the notes table;
//                      the totals, items and e-mail address sent by the client are ignored.
//  - order-status      the owner of the order (or the admin) only.
//  - update-payment-proof  the owner of the order only, and only an UploadThing URL.
//  - approve / reject  e-mail links are HMAC-signed, open a confirmation page (so mail scanners that
//                      pre-fetch links cannot approve anything) and the decision is made by a POST.
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, type SessionUser } from "@/lib/getSessionUser";
import { rateLimit } from "@/lib/rate-limit";
import { FEE_PLANS, MIN_ORDER, priceCoupon } from "@/lib/feePlans";

// ── helpers ────────────────────────────────────────────────────────────────────
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const baseUrl = () => process.env.NEXTAUTH_URL || "https://intense-learners.vercel.app";
const adminEmail = () => process.env.ADMIN_EMAIL || "saquibnadeem0@gmail.com";

function signingSecret(): string {
  const s = process.env.ADMIN_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("No signing secret configured");
  return s;
}

type Decision = "approve" | "reject";

function signDecision(orderId: string, decision: Decision): string {
  return crypto.createHmac("sha256", signingSecret()).update(`order:${orderId}:${decision}`).digest("hex");
}

function verifyDecision(orderId: string, decision: string, sig: string): decision is Decision {
  if (decision !== "approve" && decision !== "reject") return false;
  const expected = Buffer.from(signDecision(orderId, decision));
  const given = Buffer.from(String(sig || ""));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function decisionLink(orderId: string, decision: Decision): string {
  return `${baseUrl()}/api/payments?action=decide-order&orderId=${encodeURIComponent(orderId)}&decision=${decision}&sig=${signDecision(orderId, decision)}`;
}

function isAdmin(session: SessionUser | null): boolean {
  if (!session) return false;
  const email = process.env.ADMIN_EMAIL;
  return session.user.role === "ADMIN" || (!!email && session.user.email.toLowerCase() === email.toLowerCase());
}

/** Only files that were uploaded through our UploadThing account are accepted as payment proof. */
function isUploadThingUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && (u.hostname === "utfs.io" || u.hostname.endsWith(".ufs.sh") || u.hostname === "ufs.sh");
  } catch {
    return false;
  }
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const html = (body: string, status = 200) => new NextResponse(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

const page = (title: string, bodyHtml: string) => `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f3f4f6;">
<div style="text-align:center;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px;margin:16px;">${bodyHtml}</div></body></html>`;

// ── e-mail ─────────────────────────────────────────────────────────────────────
async function sendEmailViaBrevo(to: string, toName: string, subject: string, htmlContent: string, textContent: string) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY not set");
  const sender = process.env.BREVO_SENDER_EMAIL || "saquibnadeem0@gmail.com";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": key },
    body: JSON.stringify({
      sender: { name: "Intense Learners", email: sender },
      to: [{ email: to, name: toName }],
      replyTo: { email: sender, name: "Intense Learners" },
      subject,
      htmlContent,
      textContent,
    }),
  });
  if (!res.ok) throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
}

function getPaymentProofHtml(proofUrl: string | null): string {
  if (!proofUrl) return "";
  return `<div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;text-align:center;">
    <h3 style="margin-top:0;color:#1f2937;">📸 Payment Proof</h3>
    <a href="${esc(proofUrl)}" target="_blank" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;margin:10px 0;">
      🔍 View Payment Screenshot
    </a>
  </div>`;
}

const decisionButtons = (orderId: string) => `
  <div style="margin-top:24px;text-align:center;">
    <a href="${decisionLink(orderId, "approve")}" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:0 8px;font-weight:600;display:inline-block;">✅ Approve</a>
    <a href="${decisionLink(orderId, "reject")}" style="background:#ef4444;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:0 8px;font-weight:600;display:inline-block;">❌ Reject</a>
  </div>`;

async function sendOrderNotification(
  to: string, toName: string, orderId: string, total: number,
  items: { name: string; qty?: number; price: number }[], address: any, paymentMethod: string | null,
  isAdminMail = false, paymentProofUrl: string | null = null,
) {
  const pmDisplay = paymentMethod === "qr" ? "QR Code Payment (UPI)" : paymentMethod === "cod" ? "Cash on Delivery" : "Pending";
  const pmColor = paymentMethod === "qr" ? "#7c3aed" : paymentMethod === "cod" ? "#10b981" : "#f59e0b";
  const pmIcon = paymentMethod === "qr" ? "📱" : paymentMethod === "cod" ? "💵" : "⏳";

  const itemsHtml = items.map((i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(i.name)}${i.qty ? ` × ${esc(i.qty)}` : ""}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">₹${Number(i.price).toLocaleString("en-IN")}</td>
    </tr>`).join("");

  const addressHtml = address ? `
    <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
      <h3 style="margin-top:0;color:#1f2937;">Delivery Address</h3>
      <p style="margin:5px 0;"><strong>${esc(address.name)}</strong></p>
      <p style="margin:5px 0;">${esc(address.address)}</p>
      <p style="margin:5px 0;">${esc(address.city)} - ${esc(address.pincode)}</p>
      <p style="margin:5px 0;">Phone: ${esc(address.phone)}</p>
    </div>` : "";

  const body = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;">Intense Learners</h1>
        <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px;">Learn with Intensity</p>
      </div>
      <div style="padding:30px;">
        <h2 style="color:#111827;">${isAdminMail ? "🛍️ New Order Received!" : "🎉 Order Received!"}</h2>
        <p>Hi <strong>${esc(toName)}</strong>,</p>
        <p>${isAdminMail ? "A new order needs your review." : "Thank you! Your order is pending admin approval."}</p>
        <div style="background:${pmColor}10;border:2px solid ${pmColor};border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
          <strong style="color:${pmColor};">${pmIcon} ${pmDisplay}</strong>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Order ID:</strong> <code style="font-size:13px;">${esc(orderId)}</code></p>
          <p style="margin:4px 0;"><strong>Total:</strong> <span style="color:#4f46e5;font-size:18px;font-weight:700;">₹${total.toLocaleString("en-IN")}</span></p>
        </div>
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}
          <tr style="font-weight:bold;border-top:2px solid #e5e7eb;">
            <td style="padding:12px 8px 0;">Total</td>
            <td style="padding:12px 8px 0;text-align:right;">₹${total.toLocaleString("en-IN")}</td>
          </tr>
        </table>
        ${addressHtml}
        ${isAdminMail && paymentProofUrl ? getPaymentProofHtml(paymentProofUrl) : ""}
        ${isAdminMail ? decisionButtons(orderId) : `
          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#92400e;">⏳ Pending admin approval. Save your Order ID:<br><strong><code>${esc(orderId)}</code></strong></p>
          </div>`}
      </div>
      <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #f3f4f6;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Intense Learners · All rights reserved</p>
      </div>
    </div>
  </body></html>`;

  await sendEmailViaBrevo(
    to, toName,
    isAdminMail ? `🛍️ New Order #${orderId.slice(0, 8)} — Action Required` : `🎉 Order Confirmation #${orderId.slice(0, 8)}`,
    body,
    `Order ${orderId} | Payment: ${pmDisplay} | Total: ₹${total}`,
  );
}

// ── order ownership ────────────────────────────────────────────────────────────
async function findOwnOrder(session: SessionUser, orderId: string) {
  const mine = {
    OR: [
      { userId: session.user.id },
      ...(session.user.email ? [{ userEmail: session.user.email }] : []),
    ],
  };
  const exact = await prisma.order.findFirst({ where: { id: orderId, ...(isAdmin(session) ? {} : mine) } });
  if (exact) return exact;
  // the order id shown in e-mails is the first 8 characters; accept that for the user's own orders
  if (orderId.length >= 8) {
    return prisma.order.findFirst({ where: { id: { startsWith: orderId }, ...(isAdmin(session) ? {} : mine) } });
  }
  return null;
}

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const orderId = searchParams.get("orderId");

    // Admin e-mail link -> confirmation page. Nothing changes on GET.
    if (action === "decide-order" && orderId) {
      const decision = searchParams.get("decision") || "";
      const sig = searchParams.get("sig") || "";
      if (!verifyDecision(orderId, decision, sig)) {
        return html(page("Invalid link", `<h1 style="color:#ef4444;">Link not valid</h1><p>This approve/reject link is invalid or has been tampered with.</p>`), 400);
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return html(page("Not found", `<h1>Order not found</h1>`), 404);
      if (order.status !== "pending") {
        return html(page("Already decided", `<h1>Already ${esc(order.status)}</h1><p>Order <code>${esc(order.id)}</code> was already ${esc(order.status)}.</p>`));
      }
      const label = decision === "approve" ? "Approve" : "Reject";
      const color = decision === "approve" ? "#10b981" : "#ef4444";
      return html(page(`${label} order`, `
        <h1 style="color:${color};">${label} this order?</h1>
        <p>Order <code>${esc(order.id)}</code><br>${esc(order.userName || order.userEmail)} · ₹${order.total.toLocaleString("en-IN")}</p>
        <button id="go" style="background:${color};color:#fff;border:0;border-radius:8px;padding:12px 28px;font-size:16px;font-weight:600;cursor:pointer;">${label}</button>
        <p id="msg" style="margin-top:16px;"></p>
        <script>
          document.getElementById('go').addEventListener('click', async function () {
            var b = this; b.disabled = true;
            try {
              var r = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'decide-order', orderId: ${JSON.stringify(order.id)}, decision: ${JSON.stringify(decision)}, sig: ${JSON.stringify(sig)} }) });
              var d = await r.json();
              document.getElementById('msg').textContent = d.message || d.error || 'Done';
              if (!r.ok) b.disabled = false; else b.style.display = 'none';
            } catch (e) { document.getElementById('msg').textContent = 'Network error'; b.disabled = false; }
          });
        </script>`));
    }

    if (action === "fee-plans") {
      return json({ success: true, plans: FEE_PLANS });
    }

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
      return json({
        success: true,
        notes: notes.map((n) => ({ ...n, teacher: { name: n.teacher.user.name, avatar: n.teacher.user.avatar } })),
      });
    }

    const session = await getSessionUser(req);

    if (action === "order-status" && orderId) {
      if (!session) return json({ error: "Unauthorized" }, 401);
      const limit = await rateLimit({ identifier: `order-status:${session.user.id}`, limit: 60, window: 3600 });
      if (!limit.success) return json({ error: "Too many requests" }, 429);
      const order = await findOwnOrder(session, orderId.trim());
      if (!order) return json({ error: "Order not found" }, 404);
      return json({ success: true, order });
    }

    if (action === "my-orders") {
      if (!session) return json({ error: "Unauthorized" }, 401);
      const orders = await prisma.order.findMany({
        where: { OR: [{ userId: session.user.id }, ...(session.user.email ? [{ userEmail: session.user.email }] : [])] },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return json({ success: true, orders });
    }

    if (action === "admin-orders") {
      if (!isAdmin(session)) return json({ error: "Forbidden" }, 403);
      const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
      return json({ success: true, orders });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[payments GET]", err);
    return json({ error: "Something went wrong" }, 500);
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request" }, 400);
    const { action } = body;

    // Admin decision (signed link + confirmation page). No login needed: the signature is the credential.
    if (action === "decide-order") {
      const { orderId, decision, sig } = body;
      if (typeof orderId !== "string" || !verifyDecision(orderId, String(decision), String(sig))) {
        return json({ error: "Invalid or tampered link" }, 400);
      }
      const newStatus = decision === "approve" ? "approved" : "rejected";
      // compare-and-set so a pending order can only be decided once
      const changed = await prisma.order.updateMany({ where: { id: orderId, status: "pending" }, data: { status: newStatus } });
      if (changed.count === 0) return json({ error: "This order was already decided or does not exist." }, 409);

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        sendEmailViaBrevo(
          order.userEmail, order.userName || "Customer",
          newStatus === "approved" ? `✅ Order #${order.id.slice(0, 8)} Approved!` : `❌ Order #${order.id.slice(0, 8)} Update`,
          `<h2>Order ${newStatus === "approved" ? "Approved ✅" : "Rejected ❌"}</h2>
           <p>Hi <strong>${esc(order.userName || "Customer")}</strong>,</p>
           <p>Your order <strong>${esc(order.id)}</strong> has been <strong>${newStatus}</strong>.</p>
           <p>${newStatus === "approved" ? "Your order will be processed and delivered soon. Thank you for choosing Intense Learners!" : "Please contact support for more information."}</p>`,
          `Your order ${order.id} has been ${newStatus}.`,
        ).catch((e) => console.error("[payments] decision e-mail failed", e));
      }
      return json({ success: true, message: `Order ${newStatus}. The customer has been notified by e-mail.` });
    }

    // Public, read-only maths — safe without login.
    if (action === "validate-coupon") {
      const subtotal = Number(body.subtotal);
      if (!Number.isFinite(subtotal) || subtotal < 0) return json({ error: "Invalid subtotal" }, 400);
      const result = priceCoupon(String(body.code ?? ""), subtotal);
      if (!result.ok) return json({ error: result.error }, 400);
      return json({ success: true, discount: result.discount, label: result.label, code: result.code });
    }

    const session = await getSessionUser(req);
    if (!session) return json({ error: "Please sign in to continue" }, 401);

    if (action === "update-payment-proof") {
      const { orderId, proofUrl } = body;
      if (typeof orderId !== "string" || !orderId) return json({ error: "Missing orderId" }, 400);
      if (!isUploadThingUrl(proofUrl)) return json({ error: "Invalid proof file" }, 400);

      const limit = await rateLimit({ identifier: `proof:${session.user.id}`, limit: 20, window: 3600 });
      if (!limit.success) return json({ error: "Too many requests" }, 429);

      const own = await findOwnOrder(session, orderId);
      if (!own) return json({ error: "Order not found" }, 404);
      if (own.status !== "pending") return json({ error: "This order has already been processed" }, 409);

      const order = await prisma.order.update({ where: { id: own.id }, data: { paymentProof: proofUrl } });
      sendEmailViaBrevo(
        adminEmail(), "Admin",
        `💰 Payment Proof Uploaded — Order #${order.id.slice(0, 8)}`,
        `<h2>💰 Payment Proof Uploaded</h2>
         <p><strong>Order ID:</strong> ${esc(order.id)}</p>
         <p><strong>Customer:</strong> ${esc(order.userName || order.userEmail)}</p>
         <p><strong>Amount:</strong> ₹${order.total.toLocaleString("en-IN")}</p>
         ${getPaymentProofHtml(proofUrl)}
         ${decisionButtons(order.id)}`,
        `Payment proof uploaded for order ${order.id}. View: ${proofUrl}`,
      ).catch((e) => console.error("[payments] proof e-mail failed", e));
      return json({ success: true });
    }

    if (action === "create-order") {
      const limit = await rateLimit({ identifier: `create-order:${session.user.id}`, limit: 10, window: 3600 });
      if (!limit.success) return json({ error: "Too many orders. Please try again later." }, 429);

      const { items, couponCode, address, paymentMethod } = body;
      if (paymentMethod !== "qr" && paymentMethod !== "cod") return json({ error: "Invalid payment method" }, 400);
      if (!Array.isArray(items) || items.length === 0 || items.length > 30) return json({ error: "Cart is empty or too large" }, 400);

      // 1) Price every line from the server's own data.
      const noteIds = items.filter((i: any) => i?.type === "hardcopy").map((i: any) => String(i.id));
      const notes = noteIds.length
        ? await prisma.note.findMany({ where: { id: { in: noteIds }, isPublished: true }, select: { id: true, title: true, subject: true, price: true } })
        : [];
      const noteById = new Map(notes.map((n) => [n.id, n]));

      const seen = new Set<string>();
      const priced: { id: string; type: "fee" | "hardcopy"; name: string; price: number; qty?: number; unitPrice?: number; subject?: string; class?: string }[] = [];
      for (const raw of items) {
        const id = String(raw?.id ?? "");
        const type = raw?.type;
        const key = `${type}:${id}`;
        if (!id || seen.has(key)) return json({ error: "Invalid or duplicate cart item" }, 400);
        seen.add(key);

        if (type === "fee") {
          const plan = FEE_PLANS.find((p) => p.id === id);
          if (!plan) return json({ error: "A fee plan in your cart is no longer available" }, 400);
          priced.push({ id, type, name: `${plan.class} · ${plan.subject} (${plan.duration})`, price: plan.price, subject: plan.subject, class: plan.class });
        } else if (type === "hardcopy") {
          const note = noteById.get(id);
          const qty = Number(raw.qty);
          if (!note) return json({ error: "A note in your cart is no longer available" }, 400);
          if (!Number.isInteger(qty) || qty < 1 || qty > 20) return json({ error: "Invalid quantity" }, 400);
          priced.push({ id, type, name: note.title, price: note.price * qty, qty, unitPrice: note.price, subject: note.subject });
        } else {
          return json({ error: "Invalid cart item" }, 400);
        }
      }

      const subtotal = priced.reduce((s, i) => s + i.price, 0);
      let couponDiscount = 0;
      let appliedCode: string | null = null;
      if (couponCode) {
        const c = priceCoupon(String(couponCode), subtotal);
        if (!c.ok) return json({ error: c.error }, 400);
        couponDiscount = c.discount;
        appliedCode = c.code;
      }
      const total = Math.max(subtotal - couponDiscount, 0);
      if (total < MIN_ORDER) return json({ error: `Minimum order is ₹${MIN_ORDER}` }, 400);

      // 2) Delivery address is only needed (and only stored) for printed notes.
      let cleanAddress: { name: string; phone: string; address: string; city: string; pincode: string } | null = null;
      if (priced.some((i) => i.type === "hardcopy")) {
        const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
        cleanAddress = {
          name: clip(address?.name, 80), phone: clip(address?.phone, 15),
          address: clip(address?.address, 200), city: clip(address?.city, 60), pincode: clip(address?.pincode, 10),
        };
        if (!cleanAddress.name || !cleanAddress.address || !cleanAddress.city) return json({ error: "Please fill all delivery address fields" }, 400);
        if (!/^\+?\d{10,13}$/.test(cleanAddress.phone)) return json({ error: "Enter a valid phone number" }, 400);
        if (!/^\d{6}$/.test(cleanAddress.pincode)) return json({ error: "Enter a valid 6-digit pincode" }, 400);
      }

      // 3) Identity comes from the session, never from the request body.
      const email = session.user.email;
      if (!email) return json({ error: "Your account has no e-mail address" }, 400);
      const customerName = cleanAddress?.name || session.user.name || "Customer";

      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          items: priced,
          subtotal,
          couponDiscount,
          total,
          couponCode: appliedCode,
          address: cleanAddress ?? undefined,
          paymentMethod,
          status: "pending",
          userEmail: email,
          userName: customerName,
          userPhone: cleanAddress?.phone ?? null,
        },
      });

      // Order is saved; notification e-mails are best effort.
      await Promise.allSettled([
        sendOrderNotification(email, customerName, order.id, total, priced, cleanAddress, paymentMethod, false, null),
        sendOrderNotification(adminEmail(), "Admin", order.id, total, priced, cleanAddress, paymentMethod, true, null),
      ]);

      return json({ success: true, order });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[payments POST]", err);
    return json({ error: "Something went wrong" }, 500);
  }
}
