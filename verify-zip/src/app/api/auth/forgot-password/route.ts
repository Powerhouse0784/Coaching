// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ── helpers ────────────────────────────────────────────────────────────────
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getExpiryTime(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30);
  return d;
}

function buildEmailHTML(resetUrl: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Reset Your Password</title>
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Intense Learners</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Learn with Intensity</p>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">Reset Your Password</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px;">
            Hi <strong style="color:#111827;">${userName}</strong>,
          </p>
          <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
            We received a request to reset the password for your Intense Learners account.
            Click the button below to set a new password. This link expires in
            <strong style="color:#111827;">30 minutes</strong>.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${resetUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">
              Reset My Password
            </a>
          </div>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:28px;">
            <p style="color:#6b7280;font-size:12px;margin:0 0 6px;">Or copy and paste this link in your browser:</p>
            <p style="color:#4f46e5;font-size:12px;margin:0;word-break:break-all;">${resetUrl}</p>
          </div>
          <div style="border-top:1px solid #f3f4f6;padding-top:24px;">
            <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
              If you didn't request a password reset, you can safely ignore this email.
              Your password will remain unchanged and this link will expire automatically.
            </p>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} Intense Learners Technologies Pvt. Ltd. · All rights reserved
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ── Resend email sender ────────────────────────────────────────────────────
async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `Intense Learners <${fromEmail}>`,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  const data = await res.json();
  console.log("[forgot-password] Resend response:", data);
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.email !== "string" || !body.email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = body.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, isActive: true },
    });

    // Always return success — prevents email enumeration attacks
    if (!user || !user.isActive) {
      console.log(`[forgot-password] No active user found for: ${normalizedEmail}`);
      return NextResponse.json(
        { success: true, message: "If that email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Invalidate any existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Create fresh token
    const rawToken  = generateResetToken();
    const expiresAt = getExpiryTime();

    await prisma.passwordResetToken.create({
      data: { token: rawToken, email: normalizedEmail, expiresAt, used: false },
    });

    // Build reset URL using your production domain
    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "https://intense-learners.vercel.app/"
    ).replace(/\/$/, "");

    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;
    const userName = user.name || "Student";

    const subject = "Reset your Intense Learners password";
    const html    = buildEmailHTML(resetUrl, userName);
    const text    = `Hi ${userName},\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request this, ignore this email.\n\n– Intense Learners`;

    try {
      await sendViaResend(normalizedEmail, subject, html, text);
      console.log(`[forgot-password] Reset email sent successfully to: ${normalizedEmail}`);
    } catch (emailErr) {
      console.error("[forgot-password] Resend failed:", emailErr);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again in a few minutes." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "If that email exists, a reset link has been sent." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[forgot-password] Unhandled error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}