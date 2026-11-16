import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getClientIp, rateLimit } from "@/lib/rate-limit"

// Compared against when the e-mail is unknown, so "no such user" takes as long as "wrong password".
const DUMMY_HASH = "$2b$10$zi2z2w82/626.XTzUp46yu7mdUaF1GyuBWIBiMR1gaRXndRBE2EqG"

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error("Mobile login: NEXTAUTH_SECRET is not set")
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
    }

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const role = typeof body?.role === "string" ? body.role : undefined

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // Brute-force protection: per e-mail and per IP.
    const [byEmail, byIp] = await Promise.all([
      rateLimit({ identifier: `login:email:${email.toLowerCase()}`, limit: 10, window: 900 }),
      rateLimit({ identifier: `login:ip:${getClientIp(req)}`, limit: 60, window: 900 }),
    ])
    if (!byEmail.success || !byIp.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 })
    }

    // Phone keyboards capitalise the first letter, so match the e-mail case-insensitively.
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true, email: true, name: true, password: true,
        role: true, isActive: true, avatar: true,
      },
    })

    const isValid = await bcrypt.compare(password, user?.password || DUMMY_HASH)
    if (!user || !user.password || !isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Account is deactivated" }, { status: 403 })
    }

    if (role && role !== user.role) {
      return NextResponse.json(
        { error: `This account is registered as ${user.role.toLowerCase()}. Please select the correct role.` },
        { status: 400 }
      )
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      secret,
      { expiresIn: "30d", algorithm: "HS256" }
    )

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    })
  } catch (error) {
    console.error("Mobile login error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
