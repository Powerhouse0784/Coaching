import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, name: true, password: true,
        role: true, isActive: true, avatar: true,
      },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
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
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
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