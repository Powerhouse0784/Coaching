import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const path = req.nextUrl.pathname

  // Protect student routes
  if (path.startsWith("/student") && token?.role !== "STUDENT") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Protect teacher routes
  if (path.startsWith("/teacher") && token?.role !== "TEACHER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Protect admin routes
  if (path.startsWith("/admin") && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/student/:path*", "/teacher/:path*", "/admin/:path*"],
}
