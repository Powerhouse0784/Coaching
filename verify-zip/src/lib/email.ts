// lib/email.ts
import nodemailer from 'nodemailer';

// Use Brevo SMTP (free tier)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'saquibnadeem0@gmail.com', // Your email
    pass: process.env.BREVO_API_KEY || process.env.EMAIL_PASSWORD, // Use Brevo API key
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"Intense Learners" <${process.env.EMAIL_FROM || 'saquibnadeem0@gmail.com'}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error);
  }
}