import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactFormRateLimit, getClientIp, trackContactSubmission } from '@/lib/rate-limit';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for professional contact form
const createContactEmailTemplate = (data: any) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 30px;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .info-value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .message-box {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      margin-top: 10px;
    }
    .message-box p {
      margin: 0;
      color: #333;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e0e0e0, transparent);
      margin: 30px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .timestamp {
      font-size: 12px;
      color: #999;
      margin-top: 20px;
      text-align: center;
    }
    .action-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      transition: transform 0.2s;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 20px;
    }
    .stat-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
      margin-top: 5px;
    }
    .priority-high { color: #e74c3c; }
    .priority-medium { color: #f39c12; }
    .priority-normal { color: #27ae60; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 EduElite</h1>
      <div class="badge">New Contact Message</div>
    </div>

    <div class="content">
      <div class="info-section">
        <div class="info-label">👤 From</div>
        <div class="info-value">${data.name}</div>
      </div>

      <div class="info-section">
        <div class="info-label">📧 Email</div>
        <div class="info-value">
          <a href="mailto:${data.email}" style="color: #667eea; text-decoration: none;">${data.email}</a>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Category</div>
          <div class="stat-value">${data.category.charAt(0).toUpperCase() + data.category.slice(1)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Priority</div>
          <div class="stat-value priority-${data.priority}">${data.priority.toUpperCase()}</div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="info-section">
        <div class="info-label">💬 Subject</div>
        <div class="info-value">${data.subject}</div>
      </div>

      <div class="info-section">
        <div class="info-label">📝 Message</div>
        <div class="message-box">
          <p>${data.message}</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="action-button">
          Reply to ${data.name}
        </a>
      </div>

      <div class="timestamp">
        Received on ${new Date().toLocaleString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata'
        })} IST
      </div>
    </div>

    <div class="footer">
      <p><strong>EduElite Learning Platform</strong></p>
      <p>Sohna, Haryana, India</p>
      <p>
        <a href="mailto:support@eduelite.com">support@eduelite.com</a> | 
        <a href="tel:+919810493309">+91 98104 93309</a>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 15px;">
        This is an automated message from your contact form.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Auto-reply email template
const createAutoReplyTemplate = (data: any) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting EduElite</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 50px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header p {
      color: rgba(255, 255, 255, 0.9);
      margin: 10px 0 0;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
    }
    .message {
      color: #666;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      text-align: center;
    }
    .highlight-box h3 {
      margin: 0 0 10px;
      color: #667eea;
      font-size: 18px;
    }
    .highlight-box p {
      margin: 0;
      color: #555;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 20px auto;
      text-align: center;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Thank You!</h1>
      <p>We've received your message</p>
    </div>

    <div class="content">
      <div class="greeting">Hi ${data.name},</div>
      
      <div class="message">
        <p>Thank you for reaching out to <strong>EduElite</strong>! We've successfully received your message and our team is reviewing it.</p>
        
        <p>We understand that <strong>${data.category}</strong> inquiries are important, and we're committed to providing you with the best support possible.</p>
      </div>

      <div class="highlight-box">
        <h3>⏱️ Expected Response Time</h3>
        <p>We typically respond within <strong>24 hours</strong> during business days.</p>
        <p style="margin-top: 10px; font-size: 12px;">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta-button">
          Visit Our Platform
        </a>
      </div>

      <div class="message">
        <p style="font-size: 14px; color: #999;">
          <strong>Note:</strong> This is an automated confirmation email. Please do not reply to this email. 
          If you need immediate assistance, please call us at <a href="tel:+919810493309" style="color: #667eea;">+91 98104 93309</a>.
        </p>
      </div>
    </div>

    <div class="footer">
      <p><strong>EduElite Learning Platform</strong></p>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        📍 Sohna, Haryana, India<br>
        📧 support@eduelite.com | ☎️ +91 98104 93309      </p>
      <p style="font-size: 11px; color: #bbb; margin-top: 20px;">
        © ${new Date().getFullYear()} EduElite. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

function getPriority(category: string): string {
  const priorities: { [key: string]: string } = {
    bug: 'high',
    technical: 'high',
    billing: 'medium',
    feature: 'medium',
    general: 'normal',
    feedback: 'normal',
    partnership: 'medium',
    teaching: 'medium'
  };
  return priorities[category] || 'normal';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, category, message } = body;

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = await contactFormRateLimit(clientIp);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: `Too many requests. Please try again in ${Math.ceil((rateLimitResult.reset * 1000 - Date.now()) / 60000)} minutes.`,
          retryAfter: rateLimitResult.reset 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    const priority = getPriority(category);
    const emailData = { name, email, subject, category, message, priority };

    // Send email to admin
    const adminEmail = await resend.emails.send({
      from: 'EduElite Contact <onboarding@resend.dev>', // Change to your verified domain
      to: ['saquibnadeem0@gmail.com'], // Change to your admin email
      replyTo: email,
      subject: `[${category.toUpperCase()}] ${subject}`,
      html: createContactEmailTemplate(emailData),
    });

    // Send auto-reply to user
    const userEmail = await resend.emails.send({
      from: 'EduElite Support <onboarding@resend.dev>', // Change to your verified domain
      to: [email],
      subject: `Thank you for contacting EduElite - ${subject}`,
      html: createAutoReplyTemplate(emailData),
    });

    // Track submission for analytics
    await trackContactSubmission({
      email,
      category,
      timestamp: Date.now(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully! Check your email for confirmation.',
        adminEmailId: adminEmail.data?.id,
        userEmailId: userEmail.data?.id,
      },
      {
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        }
      }
    );

  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}