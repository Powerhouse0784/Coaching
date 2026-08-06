import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface MobileTokenPayload {
  id: string;
  email: string;
  role: string;
  name: string | null;
}

export async function getSessionUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as MobileTokenPayload;
      return { user: { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name } };
    } catch {
      return null;
    }
  }

  return await getServerSession(authOptions);
}