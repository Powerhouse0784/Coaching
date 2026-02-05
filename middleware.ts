import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const path = req.nextUrl.pathname

  // ✅ Add debugging
  console.log("🔐 Middleware check:", {
    path,
    tokenExists: !!token,
    role: token?.role,
    email: token?.email,
  })

  // Protect student routes
  if (path.startsWith("/student") && token?.role !== "STUDENT") {
    console.log("❌ Blocked STUDENT route - Role:", token?.role)
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Protect teacher routes
  if (path.startsWith("/teacher") && token?.role !== "TEACHER") {
    console.log("❌ Blocked TEACHER route - Role:", token?.role)
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Protect admin routes
  if (path.startsWith("/admin") && token?.role !== "ADMIN") {
    console.log("❌ Blocked ADMIN route - Role:", token?.role)
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  console.log("✅ Access granted")
  return NextResponse.next()
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*"],
}