// app/api/auth/register/route.ts
import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Teacher accounts need the academy's registration code. It lives in the TEACHER_REGISTRATION_CODE env var. */
function teacherCodeIsValid(given: unknown): boolean {
  const expected = process.env.TEACHER_REGISTRATION_CODE
  if (!expected || typeof given !== "string") return false
  const a = Buffer.from(given.trim().toUpperCase())
  const b = Buffer.from(expected.trim().toUpperCase())
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit({ identifier: `register:${getClientIp(req)}`, limit: 15, window: 3600 })
    if (!limit.success) {
      return NextResponse.json({ error: "Too many sign-ups from this network. Please try again later." }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const role = body?.role

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 })
    }
    if (name.length > 80) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 })
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 })
    }
    if (password.length < 6 || password.length > 72) {
      return NextResponse.json({ error: "Password must be 6-72 characters long" }, { status: 400 })
    }

    if (role !== "STUDENT" && role !== "TEACHER") {
      return NextResponse.json({ error: "Invalid role. Must be STUDENT or TEACHER" }, { status: 400 })
    }

    // The code used to be checked only in the browser/app (and shipped inside them), so anyone could skip it.
    if (role === "TEACHER" && !teacherCodeIsValid(body?.teacherCode)) {
      return NextResponse.json({ error: "Invalid teacher registration code." }, { status: 403 })
    }

    const exists = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    })
    if (exists) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isActive: true,
        avatar: null,
        ...(role === "STUDENT" && { student: { create: {} } }),
        ...(role === "TEACHER" && { teacher: { create: { experience: null, rating: 0 } } }),
      },
    })

    console.log(`New ${role.toLowerCase()} registered: ${user.id}`)

    return NextResponse.json(
      {
        success: true,
        message: `${role === "STUDENT" ? "Student" : "Teacher"} account created successfully`,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
