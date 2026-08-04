import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface MobileTokenPayload {
  id: string;
  email: string;
  role: string;
}

export async function getSessionUser(req: NextRequest) {
  // 1. Mobile app sends a Bearer token — check that first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as MobileTokenPayload;
      return { user: { id: decoded.id, email: decoded.email, role: decoded.role } };
    } catch {
      return null;
    }
  }

  // 2. Web app uses the normal NextAuth cookie session
  return await getServerSession(authOptions);
}