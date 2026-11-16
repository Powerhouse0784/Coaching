import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import jwt from "jsonwebtoken";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface MobileTokenPayload {
  id: string;
  email: string;
  role: string;
  name: string | null;
}

export interface SessionUser {
  user: { id: string; email: string; role: string; name: string | null };
}

// A bearer token stays cryptographically valid for 30 days, so we re-check the
// account against the database. A short in-memory cache keeps that to ~1 query
// per user per minute instead of one per request.
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 5_000;
const cache = new Map<string, { expires: number; user: SessionUser["user"] | null }>();

async function loadActiveUser(id: string): Promise<SessionUser["user"] | null> {
  const hit = cache.get(id);
  if (hit && hit.expires > Date.now()) return hit.user;

  const row = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, name: true, isActive: true },
  });
  const user = row && row.isActive ? { id: row.id, email: row.email, role: row.role, name: row.name } : null;

  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(id, { expires: Date.now() + CACHE_TTL_MS, user });
  return user;
}

/** Call after deactivating a user / changing their role so it applies immediately. */
export function forgetSessionUser(id: string) {
  cache.delete(id);
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    try {
      const decoded = jwt.verify(authHeader.slice(7), secret, { algorithms: ["HS256"] }) as MobileTokenPayload;
      if (!decoded?.id) return null;
      const user = await loadActiveUser(decoded.id);
      return user ? { user } : null;
    } catch {
      return null;
    }
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      role: session.user.role,
      name: session.user.name ?? null,
    },
  };
}

export function hasRole(session: SessionUser | null, ...roles: string[]): boolean {
  return !!session && roles.includes(session.user.role);
}
