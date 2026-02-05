import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const path = req.nextUrl.pathname

  // ✅ Add logging
  console.log("🔐 Middleware check:", {
    path,
    tokenExists: !!token,
    role: token?.role,
    email: token?.email,
  })

  // Protect student routes
  if (path.startsWith("/student")) {
    if (!token) {
      console.log("❌ No token, redirecting to home")
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (token.role !== "STUDENT") {
      console.log("❌ Blocked STUDENT route - Role:", token?.role)
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Protect teacher routes
  if (path.startsWith("/teacher")) {
    if (!token) {
      console.log("❌ No token, redirecting to home")
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (token.role !== "TEACHER") {
      console.log("❌ Blocked TEACHER route - Role:", token?.role)
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  // Protect admin routes
  if (path.startsWith("/admin")) {
    if (!token) {
      console.log("❌ No token, redirecting to home")
      return NextResponse.redirect(new URL('/', req.url))
    }
    if (token.role !== "ADMIN") {
      console.log("❌ Blocked ADMIN route - Role:", token?.role)
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }

  console.log("✅ Access granted")
  return NextResponse.next()
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*"],
}