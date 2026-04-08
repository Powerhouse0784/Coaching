// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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
               style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
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
        email: process.env.EMAIL_FROM!,
      },
      to: [{ email: to, name: toName }],
      replyTo: {
        email: process.env.EMAIL_FROM!,
        name: "Intense Learners",
      },
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorBody}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      console.log(`[forgot-password] No active user for: ${normalizedEmail}`);
      return NextResponse.json(
        { success: true, message: "If that email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Invalidate existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Create new token
    const rawToken  = generateResetToken();
    const expiresAt = getExpiryTime();

    await prisma.passwordResetToken.create({
      data: {
        token:    rawToken,
        email:    normalizedEmail,
        expiresAt,
        used:     false,
      },
    });

    const baseUrl  = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;
    const userName = user.name || "Student";

    try {
      await sendEmailViaBrevo(
        normalizedEmail,
        userName,
        "Reset your Intense Learners password",
        buildEmailHTML(resetUrl, userName),
        `Hi ${userName},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request this, ignore this email.\n\n– Intense Learners`
      );
    } catch (emailError) {
      console.error("[forgot-password] Brevo error:", emailError);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[forgot-password] Reset email sent to: ${normalizedEmail}`);

    return NextResponse.json(
      { success: true, message: "If that email exists, a reset link has been sent." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[forgot-password] Caught error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}