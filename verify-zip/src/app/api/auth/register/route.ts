// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json()

    // Validate
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      )
    }

    // Validate role
    if (role !== "STUDENT" && role !== "TEACHER") {
      return NextResponse.json(
        { error: "Invalid role. Must be STUDENT or TEACHER" },
        { status: 400 }
      )
    }

    // Check if user exists
    const exists = await prisma.user.findUnique({
      where: { email },
    })

    if (exists) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with appropriate role-specific record
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        isActive: true,
        avatar: null,
        // Create role-specific record
        ...(role === "STUDENT" && {
          student: {
            create: {},
          },
        }),
        ...(role === "TEACHER" && {
          teacher: {
            create: {
              experience: null,
              rating: 0,
            },
          },
        }),
      },
      include: {
        student: role === "STUDENT",
        teacher: role === "TEACHER",
      },
    })

    console.log(`✅ New ${role.toLowerCase()} registered: ${name} (${email})`)

    return NextResponse.json(
      { 
        success: true,
        message: `${role === "STUDENT" ? "Student" : "Teacher"} account created successfully`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}