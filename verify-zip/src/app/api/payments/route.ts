// app/api/payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
// ── Fee Plans ──────────────────────────────────────────────────────────────────
export const FEE_PLANS = [

  // ── Class 5 ──────────────────────────────────────────────────────────────
  { id: "cls5-math", class: "Class 5", subject: "Mathematics", price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-eng",  class: "Class 5", subject: "English",     price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-sci",  class: "Class 5", subject: "Science",     price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-sst",  class: "Class 5", subject: "Social Sc.",  price: 250,  originalPrice: 499,  duration: "1 Month", popular: false },
  { id: "cls5-all",  class: "Class 5", subject: "All Subjects",price: 800, originalPrice: 1999, duration: "1 Month", popular: true  },

  // ── Class 6 ──────────────────────────────────────────────────────────────
  { id: "cls6-math", class: "Class 6", subject: "Mathematics", price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-eng",  class: "Class 6", subject: "English",     price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-sci",  class: "Class 6", subject: "Science",     price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-sst",  class: "Class 6", subject: "Social Sc.",  price: 350,  originalPrice: 599,  duration: "1 Month", popular: false },
  { id: "cls6-all",  class: "Class 6", subject: "All Subjects",price: 1200, originalPrice: 2399, duration: "1 Month", popular: true  },

  // ── Class 7 ──────────────────────────────────────────────────────────────
  { id: "cls7-math", class: "Class 7", subject: "Mathematics", price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-eng",  class: "Class 7", subject: "English",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-sci",  class: "Class 7", subject: "Science",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-sst",  class: "Class 7", subject: "Social Sc.",  price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls7-all",  class: "Class 7", subject: "All Subjects",price: 1400, originalPrice: 2649, duration: "1 Month", popular: true  },

  // ── Class 8 ──────────────────────────────────────────────────────────────
  { id: "cls8-math", class: "Class 8", subject: "Mathematics", price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-eng",  class: "Class 8", subject: "English",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-sci",  class: "Class 8", subject: "Science",     price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-sst",  class: "Class 8", subject: "Social Sc.",  price: 400,  originalPrice: 649,  duration: "1 Month", popular: false },
  { id: "cls8-all",  class: "Class 8", subject: "All Subjects",price: 1400, originalPrice: 2649, duration: "1 Month", popular: true  },

  // ── Class 9 ──────────────────────────────────────────────────────────────
  { id: "cls9-math", class: "Class 9", subject: "Mathematics", price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-eng",  class: "Class 9", subject: "English",     price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-sci",  class: "Class 9", subject: "Science",     price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-sst",  class: "Class 9", subject: "Social Sc.",  price: 550,  originalPrice: 799,  duration: "1 Month", popular: false },
  { id: "cls9-all",  class: "Class 9", subject: "All Subjects",price: 2000, originalPrice: 3099, duration: "1 Month", popular: true  },

  // ── Class 10 ─────────────────────────────────────────────────────────────
  { id: "cls10-math", class: "Class 10", subject: "Mathematics", price: 600,  originalPrice: 899, duration: "1 Month", popular: false },
  { id: "cls10-sci",  class: "Class 10", subject: "Science",     price: 600,  originalPrice: 899, duration: "1 Month", popular: false },
  { id: "cls10-eng",  class: "Class 10", subject: "English",     price: 600,  originalPrice: 899,  duration: "1 Month", popular: false },
  { id: "cls10-sst",  class: "Class 10", subject: "Social Sc.",  price: 600,  originalPrice: 899,  duration: "1 Month", popular: false },
  
  { id: "cls10-all",  class: "Class 10", subject: "All Subjects",price: 2200, originalPrice: 3599, duration: "1 Month", popular: true  },

  // ── Class 11 — Science ────────────────────────────────────────────────────
  { id: "cls11-sci-phy",  class: "Class 11 (Science)", subject: "Physics",     price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-chem", class: "Class 11 (Science)", subject: "Chemistry",   price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-math", class: "Class 11 (Science)", subject: "Mathematics", price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-bio",  class: "Class 11 (Science)", subject: "Biology",     price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-eng",  class: "Class 11 (Science)", subject: "English",     price: 700,  originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "cls11-sci-cs",   class: "Class 11 (Science)", subject: "Computer Sc.",price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-sci-pcm",  class: "Class 11 (Science)", subject: "PCM Bundle",  price: 2200, originalPrice: 3797, duration: "1 Month", popular: true  },
  { id: "cls11-sci-pcb",  class: "Class 11 (Science)", subject: "PCB Bundle",  price: 2200, originalPrice: 3797, duration: "1 Month", popular: true  },

  // ── Class 11 — Commerce ───────────────────────────────────────────────────
  { id: "cls11-com-acc",  class: "Class 11 (Commerce)", subject: "Accountancy",       price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-eco",  class: "Class 11 (Commerce)", subject: "Economics",         price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-bst",  class: "Class 11 (Commerce)", subject: "Business Studies",  price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-math", class: "Class 11 (Commerce)", subject: "Mathematics",       price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-eng",  class: "Class 11 (Commerce)", subject: "English",           price: 700,  originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "cls11-com-ip",   class: "Class 11 (Commerce)", subject: "Informatics Pr.",   price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls11-com-core", class: "Class 11 (Commerce)", subject: "Core 3 (Acc+Eco+BSt)",price: 2200, originalPrice: 3897, duration: "1 Month", popular: true  },

  // ── Class 11 — Arts / Humanities ─────────────────────────────────────────
  { id: "cls11-arts-hist",  class: "Class 11 (Arts)", subject: "History",          price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-geo",   class: "Class 11 (Arts)", subject: "Geography",        price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-pol",   class: "Class 11 (Arts)", subject: "Political Science",price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-eco",   class: "Class 11 (Arts)", subject: "Economics",        price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-soci",  class: "Class 11 (Arts)", subject: "Sociology",        price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-psych", class: "Class 11 (Arts)", subject: "Psychology",       price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-eng",   class: "Class 11 (Arts)", subject: "English",          price: 700,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls11-arts-core",  class: "Class 11 (Arts)", subject: "Core 3 Subjects",  price: 1800, originalPrice: 3497, duration: "1 Month", popular: true  },
  { id: "cls11-arts-all",   class: "Class 11 (Arts)", subject: "Combined 5 Subjects",     price: 3100, originalPrice: 3500, duration: "1 Month", popular: false },

  // ── Class 12 — Science ────────────────────────────────────────────────────
  { id: "cls12-sci-phy",  class: "Class 12 (Science)", subject: "Physics",     price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-chem", class: "Class 12 (Science)", subject: "Chemistry",   price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-math", class: "Class 12 (Science)", subject: "Mathematics", price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-bio",  class: "Class 12 (Science)", subject: "Biology",     price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-eng",  class: "Class 12 (Science)", subject: "English",     price: 800,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls12-sci-cs",   class: "Class 12 (Science)", subject: "Computer Sc.",price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-sci-pcm",  class: "Class 12 (Science)", subject: "PCM Bundle",  price: 2400, originalPrice: 4197, duration: "1 Month", popular: true  },
  { id: "cls12-sci-pcb",  class: "Class 12 (Science)", subject: "PCB Bundle",  price: 2400, originalPrice: 4197, duration: "1 Month", popular: true  },

  // ── Class 12 — Commerce ───────────────────────────────────────────────────
  { id: "cls12-com-acc",  class: "Class 12 (Commerce)", subject: "Accountancy",       price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-eco",  class: "Class 12 (Commerce)", subject: "Economics",         price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-bst",  class: "Class 12 (Commerce)", subject: "Business Studies",  price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-math", class: "Class 12 (Commerce)", subject: "Mathematics",       price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-eng",  class: "Class 12 (Commerce)", subject: "English",           price: 800,  originalPrice: 1199, duration: "1 Month", popular: false },
  { id: "cls12-com-ip",   class: "Class 12 (Commerce)", subject: "Informatics Pr.",   price: 900, originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-com-core", class: "Class 12 (Commerce)", subject: "Core 3 (Acc+Eco+BSt)",price: 2400, originalPrice: 4197, duration: "1 Month", popular: true  },

  // ── Class 12 — Arts / Humanities ─────────────────────────────────────────
  { id: "cls12-arts-hist",  class: "Class 12 (Arts)", subject: "History",          price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-geo",   class: "Class 12 (Arts)", subject: "Geography",        price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-pol",   class: "Class 12 (Arts)", subject: "Political Science",price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-eco",   class: "Class 12 (Arts)", subject: "Economics",        price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-soci",  class: "Class 12 (Arts)", subject: "Sociology",        price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-psych", class: "Class 12 (Arts)", subject: "Psychology",       price: 800,  originalPrice: 1399, duration: "1 Month", popular: false },
  { id: "cls12-arts-eng",   class: "Class 12 (Arts)", subject: "English",          price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls12-arts-hin",   class: "Class 12 (Arts)", subject: "Hindi",            price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "cls12-arts-core",  class: "Class 12 (Arts)", subject: "Core 3 Subjects",  price: 2100, originalPrice: 3897, duration: "1 Month", popular: true  },
  { id: "cls12-arts-all",   class: "Class 12 (Arts)", subject: "Combined 5 Subjects",     price: 3500, originalPrice: 4000, duration: "1 Month", popular: false },

  // ── JEE (Mains + Advanced) ────────────────────────────────────────────────
  { id: "jee-phy",   class: "JEE", subject: "Physics",           price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "jee-chem",  class: "JEE", subject: "Chemistry",         price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "jee-math",  class: "JEE", subject: "Mathematics",       price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "jee-pcm",   class: "JEE", subject: "PCM Complete",      price: 3500, originalPrice: 3900, duration: "1 Month", popular: true  },

  // ── NEET ─────────────────────────────────────────────────────────────────
  { id: "neet-phy",   class: "NEET", subject: "Physics",          price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "neet-chem",  class: "NEET", subject: "Chemistry",        price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "neet-bio",   class: "NEET", subject: "Biology",          price: 1300, originalPrice: 2199, duration: "1 Month", popular: false },
  { id: "neet-pcb",   class: "NEET", subject: "PCB Complete",     price: 3500, originalPrice: 3900, duration: "1 Month", popular: true  },

  // ── CUET ─────────────────────────────────────────────────────────────────
  { id: "cuet-eng",  class: "CUET", subject: "English",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-math", class: "CUET", subject: "Mathematics",       price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-gk",   class: "CUET", subject: "General Knowledge", price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-phy",  class: "CUET", subject: "Physics",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-chem", class: "CUET", subject: "Chemistry",         price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-bio",  class: "CUET", subject: "Biology",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-acc",  class: "CUET", subject: "Accountancy",       price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-eco",  class: "CUET", subject: "Economics",         price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-hist", class: "CUET", subject: "History",           price: 1300, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "cuet-sci",  class: "CUET", subject: "Any 4 Subjects",price: 5000,originalPrice:5997, duration: "1 Month", popular: true  },

  // ── SSC ──────────────────────────────────────────────────────────────
  { id: "ssc-quant",  class: "SSC", subject: "Quantitative Aptitude", price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-eng",    class: "SSC", subject: "English Language",      price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-reason", class: "SSC", subject: "Reasoning",             price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-gk",     class: "SSC", subject: "General Awareness",     price: 1000, originalPrice: 1699, duration: "1 Month", popular: false },
  { id: "ssc-all",    class: "SSC", subject: "Package for 3 Subjects",      price: 2700, originalPrice: 6596, duration: "1 Month", popular: true  },


  // ── NDA ──────────────────────────────────────────────────────────────────
  { id: "nda-math",  class: "NDA", subject: "Mathematics",         price: 1200, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "nda-gat",   class: "NDA", subject: "General Ability Test",price: 1200, originalPrice: 1999, duration: "1 Month", popular: false },
  { id: "nda-crash", class: "NDA", subject: "Crash Course",        price: 4000, originalPrice: 6999, duration: "3 Months", popular: false },


  // ── Olympiad / NTSE ───────────────────────────────────────────────────────
  { id: "olym-math", class: "Olympiad / NTSE", subject: "Mathematics",       price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "olym-sci",  class: "Olympiad / NTSE", subject: "Science",           price: 800,  originalPrice: 1299, duration: "1 Month", popular: false },
  { id: "olym-eng",  class: "Olympiad / NTSE", subject: "English",           price: 700,  originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "olym-gk",   class: "Olympiad / NTSE", subject: "GK & Mental Ability",price: 700, originalPrice: 1099, duration: "1 Month", popular: false },
  { id: "olym-all",  class: "Olympiad / NTSE", subject: "Complete Package",  price: 2800, originalPrice: 4996, duration: "1 Month", popular: true  },
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
  return `<div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;text-align:center;">
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
  const baseUrl  = process.env.NEXTAUTH_URL || 'https://intense-learners.vercel.app';
  const pmDisplay = paymentMethod === 'qr' ? 'QR Code Payment (UPI)' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending';
  const pmColor   = paymentMethod === 'qr' ? '#7c3aed' : paymentMethod === 'cod' ? '#10b981' : '#f59e0b';
  const pmIcon    = paymentMethod === 'qr' ? '📱' : paymentMethod === 'cod' ? '💵' : '⏳';

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
        <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:14px;">Learn with Intensity</p>
      </div>
      <div style="padding:30px;">
        <h2 style="color:#111827;">${isAdmin ? '🛍️ New Order Received!' : '🎉 Order Received!'}</h2>
        <p>Hi <strong>${toName}</strong>,</p>
        <p>${isAdmin ? 'A new order needs your review.' : 'Thank you! Your order is pending admin approval.'}</p>
        <div style="background:${pmColor}10;border:2px solid ${pmColor};border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
          <strong style="color:${pmColor};">${pmIcon} ${pmDisplay}</strong>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0;">
          <p style="margin:4px 0;"><strong>Order ID:</strong> <code style="font-size:13px;">${orderId}</code></p>
          <p style="margin:4px 0;"><strong>Total:</strong> <span style="color:#4f46e5;font-size:18px;font-weight:700;">₹${total.toLocaleString('en-IN')}</span></p>
        </div>
        <table style="width:100%;border-collapse:collapse;">${itemsHtml}
          <tr style="font-weight:bold;border-top:2px solid #e5e7eb;">
            <td style="padding:12px 8px 0;">Total</td>
            <td style="padding:12px 8px 0;text-align:right;">₹${total.toLocaleString('en-IN')}</td>
          </tr>
        </table>
        ${addressHtml}
        ${isAdmin && paymentProofUrl ? getPaymentProofHtml(paymentProofUrl) : ''}
        ${isAdmin ? `
          <div style="margin-top:24px;text-align:center;">
            <a href="${baseUrl}/api/payments?action=approve-order&orderId=${orderId}" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:0 8px;font-weight:600;display:inline-block;">✅ Approve</a>
            <a href="${baseUrl}/api/payments?action=reject-order&orderId=${orderId}" style="background:#ef4444;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:0 8px;font-weight:600;display:inline-block;">❌ Reject</a>
          </div>` : `
          <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;color:#92400e;">⏳ Pending admin approval. Save your Order ID:<br><strong><code>${orderId}</code></strong></p>
          </div>`}
      </div>
      <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #f3f4f6;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Intense Learners · All rights reserved</p>
      </div>
    </div>
  </body></html>`;

  await sendEmailViaBrevo(
    to, toName,
    isAdmin ? `🛍️ New Order #${orderId.slice(0,8)} — Action Required` : `🎉 Order Confirmation #${orderId.slice(0,8)}`,
    html,
    `Order ${orderId} | Payment: ${pmDisplay} | Total: ₹${total}`
  );
}

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const action  = searchParams.get("action");
    const orderId = searchParams.get("orderId");

    // Email approve / reject quick links
    if ((action === "approve-order" || action === "reject-order") && orderId) {
      const newStatus = action === "approve-order" ? "approved" : "rejected";
      const order = await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });

      await sendEmailViaBrevo(
        order.userEmail, order.userName || 'Customer',
        newStatus === 'approved' ? `✅ Order #${order.id.slice(0,8)} Approved!` : `❌ Order #${order.id.slice(0,8)} Update`,
        `<h2>Order ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
         <p>Hi <strong>${order.userName || 'Customer'}</strong>,</p>
         <p>Your order <strong>${order.id}</strong> has been <strong>${newStatus}</strong>.</p>
         <p>${newStatus === 'approved' ? 'Your order will be processed and delivered soon. Thank you for choosing Intense Learners!' : 'Please contact support for more information.'}</p>`,
        `Your order ${order.id} has been ${newStatus}.`
      );

      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f3f4f6;">
          <div style="text-align:center;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
            <h1 style="color:${newStatus === 'approved' ? '#10b981' : '#ef4444'};">
              Order ${newStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌'}
            </h1>
            <p>Order <code>${order.id}</code> has been ${newStatus}.<br>Customer has been notified via email.</p>
          </div>
        </body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (action === "fee-plans") {
      return NextResponse.json({ success: true, plans: FEE_PLANS });
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
      return NextResponse.json({
        success: true,
        notes: notes.map(n => ({ ...n, teacher: { name: n.teacher.user.name, avatar: n.teacher.user.avatar } })),
      });
    }

    if (action === "order-status" && orderId) {
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
    const body    = await req.json();
    const { action } = body;

    if (action === "validate-coupon") {
      const { code, subtotal } = body;
      const upper  = (code as string).toUpperCase().trim();
      const coupon = COUPONS[upper];
      if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      if (subtotal < coupon.minOrder) return NextResponse.json({ error: `Minimum order ₹${coupon.minOrder} required for this coupon` }, { status: 400 });
      const discount = coupon.type === "percent"
        ? Math.floor(subtotal * coupon.value / 100)
        : Math.min(coupon.value, subtotal);
      return NextResponse.json({ success: true, discount, label: coupon.label, code: upper });
    }

    if (action === "update-payment-proof") {
      const { orderId, proofUrl } = body;
      if (!orderId || !proofUrl) return NextResponse.json({ error: "Missing orderId or proofUrl" }, { status: 400 });
      const order   = await prisma.order.update({ where: { id: orderId }, data: { paymentProof: proofUrl } });
      const baseUrl = process.env.NEXTAUTH_URL || 'https://intense-learners.vercel.app';
      await sendEmailViaBrevo(
        process.env.ADMIN_EMAIL || 'saquibnadeem0@gmail.com', 'Admin',
        `💰 Payment Proof Uploaded — Order #${orderId.slice(0,8)}`,
        `<h2>💰 Payment Proof Uploaded</h2>
         <p><strong>Order ID:</strong> ${orderId}</p>
         <p><strong>Customer:</strong> ${order.userName || order.userEmail}</p>
         <p><strong>Amount:</strong> ₹${order.total.toLocaleString('en-IN')}</p>
         ${getPaymentProofHtml(proofUrl)}
         <div style="margin-top:20px;text-align:center;">
           <a href="${baseUrl}/api/payments?action=approve-order&orderId=${orderId}" style="background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-right:10px;display:inline-block;">✅ Approve</a>
           <a href="${baseUrl}/api/payments?action=reject-order&orderId=${orderId}" style="background:#ef4444;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">❌ Reject</a>
         </div>`,
        `Payment proof uploaded for order ${orderId}. View: ${proofUrl}`
      );
      return NextResponse.json({ success: true });
    }

    if (action === "create-order") {
      const { items, subtotal, couponDiscount, total, couponCode, address, userEmail, paymentMethod } = body;
      const email = session?.user?.email || userEmail;
      if (!email) return NextResponse.json({ error: "User email required" }, { status: 401 });

      const order = await prisma.order.create({
        data: {
          userId:         session?.user?.id || null,
          items,
          subtotal,
          couponDiscount: couponDiscount || 0,
          total,
          couponCode:     couponCode || null,
          address:        address || null,
          paymentMethod,
          status:         'pending',
          userEmail:      email,
          userName:       address?.name || session?.user?.name || null,
          userPhone:      address?.phone || null,
        },
      });

      // Send customer + admin emails concurrently; don't block the response
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