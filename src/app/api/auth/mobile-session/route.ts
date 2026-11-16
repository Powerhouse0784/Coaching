// app/api/auth/mobile-session/route.ts
// GET with `Authorization: Bearer <app token>`  ->  "is this login still good?"
//
// Why it exists: the app used to sign people out on ANY 401, but many website routes answer 401 to the app's token
// (cookie-only routes, teacher-only routes asked by a student). Now the app asks this route instead and signs out only on
// an explicit 401 from here.
//
//   200 { user, token? }  session is good. `user` is the account as it is NOW (role / name changes show up),
//                         `token` is a fresh 30-day token, sent only when the current one has < 10 days left
//                         (so someone who opens the app at least once a month never has to sign in again)
//   401                   token invalid / expired, account missing or deactivated  -> the app signs out
//   503                   we could not check (database hiccup)                       -> the app KEEPS the session
//   429                   too many checks                                            -> the app KEEPS the session

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const TOKEN_LIFETIME = "30d";
const RENEW_WHEN_LESS_THAN_SECONDS = 10 * 24 * 60 * 60;
const NO_STORE = { "Cache-Control": "no-store" };

const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: NO_STORE });

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return reply({ error: "Server is not configured" }, 503);

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return reply({ error: "Not signed in" }, 401);

  let decoded: { id?: string; exp?: number };
  try {
    decoded = jwt.verify(header.slice(7), secret, { algorithms: ["HS256"] }) as typeof decoded;
  } catch {
    return reply({ error: "Session expired" }, 401);
  }
  if (!decoded?.id || typeof decoded.id !== "string") return reply({ error: "Session invalid" }, 401);

  const rl = await rateLimit({ limit: 30, window: 60, identifier: `mobile-session:${decoded.id}` });
  if (!rl.success) return reply({ error: "Too many checks" }, 429);

  let row;
  try {
    row = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true },
    });
  } catch (error) {
    console.error("mobile-session lookup failed:", error);
    return reply({ error: "Could not check the session right now" }, 503); // NOT 401: a database hiccup must never sign anyone out
  }
  if (!row || !row.isActive) return reply({ error: "Account unavailable" }, 401);

  const secondsLeft = typeof decoded.exp === "number" ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
  const token =
    secondsLeft < RENEW_WHEN_LESS_THAN_SECONDS
      ? jwt.sign({ id: row.id, email: row.email, role: row.role, name: row.name }, secret, { expiresIn: TOKEN_LIFETIME, algorithm: "HS256" })
      : undefined;

  return reply({ user: { id: row.id, name: row.name, email: row.email, role: row.role, avatar: row.avatar }, token }, 200);
}
