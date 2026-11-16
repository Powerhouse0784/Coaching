/**
 * FILE: src/app/api/admin/[[...slug]]/route.ts
 *
 * Single unified admin API handler — all admin operations in one route.
 *
 * POST   /api/admin/auth              → login, returns signed token
 * GET    /api/admin/auth              → verify existing token
 * GET    /api/admin/stats             → dashboard stats
 * GET    /api/admin/users             → list users (search + pagination)
 * PATCH  /api/admin/users/[id]        → toggle isActive / update name/role
 * DELETE /api/admin/users/[id]        → delete user
 * GET    /api/admin/notes             → list notes
 * PATCH  /api/admin/notes/[id]        → toggle isPublished / isPinned
 * DELETE /api/admin/notes/[id]        → delete note
 * GET    /api/admin/assignments       → list assignments
 * DELETE /api/admin/assignments/[id]  → delete assignment
 * GET    /api/admin/doubts            → list doubts
 * PATCH  /api/admin/doubts/[id]       → toggle isSolved
 * DELETE /api/admin/doubts/[id]       → delete doubt
 * GET    /api/admin/videos            → list video folders
 * DELETE /api/admin/videos/[id]       → delete video folder
 * GET    /api/admin/payments          → list payment orders
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma'; // adjust to your actual prisma client path

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeToken(email: string): string {
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const day    = Math.floor(Date.now() / 86_400_000);
  return crypto.createHmac('sha256', secret).update(`${email}:${day}`).digest('hex');
}

function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const email  = process.env.ADMIN_EMAIL;
  if (!email) return false;
  const secret = process.env.ADMIN_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';
  const day    = Math.floor(Date.now() / 86_400_000);
  const make   = (offset: number) =>
    crypto.createHmac('sha256', secret).update(`${email}:${day - offset}`).digest('hex');
  return token === make(0) || token === make(1); // today + yesterday (midnight edge)
}

function bearerToken(req: NextRequest) {
  return req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard responses
// ─────────────────────────────────────────────────────────────────────────────
const unauthorized = () => NextResponse.json({ success: false, error: 'Unauthorised' },       { status: 401 });
const notFound     = () => NextResponse.json({ success: false, error: 'Not found' },           { status: 404 });
const err500       = (msg: string) => NextResponse.json({ success: false, error: msg },        { status: 500 });

// ─────────────────────────────────────────────────────────────────────────────
// Pagination helper
// ─────────────────────────────────────────────────────────────────────────────
function paginate(url: URL) {
  const page   = Math.max(1,   parseInt(url.searchParams.get('page')   || '1'));
  const limit  = Math.min(100, parseInt(url.searchParams.get('limit')  || '50'));
  const search = url.searchParams.get('search') || '';
  return { page, limit, skip: (page - 1) * limit, search };
}

// ─────────────────────────────────────────────────────────────────────────────
// safe() — one failing model won't crash the whole stats response
// ─────────────────────────────────────────────────────────────────────────────
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleLogin(req: NextRequest) {
  const { email, password } = await req.json();
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return err500('Admin credentials not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  }
  if (email?.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
    await new Promise(r => setTimeout(r, 600)); // slow brute-force
    return NextResponse.json({ success: false, error: 'Invalid admin credentials' }, { status: 401 });
  }
  return NextResponse.json({ success: true, token: makeToken(adminEmail) });
}

async function handleVerify(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

async function handleStats(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();

  const [
    totalStudents, activeStudents,
    totalTeachers, activeTeachers,
    totalNotes, publishedNotes,
    totalAssignments, totalSubmissions,
    totalDoubts, pendingDoubts,
    totalVideos, totalFolders,
    totalOrders,
  ] = await Promise.all([
    safe(() => prisma.user.count({ where: { role: 'STUDENT' } }), 0),
    safe(() => prisma.user.count({ where: { role: 'STUDENT', isActive: true } }), 0),
    safe(() => prisma.user.count({ where: { role: 'TEACHER' } }), 0),
    safe(() => prisma.user.count({ where: { role: 'TEACHER', isActive: true } }), 0),
    safe(() => prisma.note.count(), 0),
    safe(() => prisma.note.count({ where: { isPublished: true } }), 0),
    safe(() => (prisma as any).assignmentV2.count(), 0),
    safe(() => (prisma as any).assignmentSubmission.count(), 0),
    safe(() => prisma.doubt.count(), 0),
    safe(() => prisma.doubt.count({ where: { isSolved: false } }), 0),
    safe(() => prisma.video.count(), 0),
    safe(() => prisma.videoFolder.count(), 0),
    safe(() => (prisma as any).paymentOrder.count({ where: { status: 'paid' } }), 0),
  ]);

  let revenue = 0;
  try {
    const agg = await (prisma as any).paymentOrder.aggregate({ where: { status: 'paid' }, _sum: { amount: true } });
    revenue = agg._sum?.amount ?? 0;
  } catch { /* model may not have amount yet */ }

  return NextResponse.json({
    success: true,
    stats: {
      students:    { total: totalStudents,    active: activeStudents    },
      teachers:    { total: totalTeachers,    active: activeTeachers    },
      notes:       { total: totalNotes,       published: publishedNotes },
      assignments: { total: totalAssignments, submitted: totalSubmissions },
      doubts:      { total: totalDoubts,      pending: pendingDoubts, solved: totalDoubts - pendingDoubts },
      videos:      { total: totalVideos,      folders: totalFolders     },
      payments:    { total: totalOrders,      revenue: `₹${revenue.toLocaleString('en-IN')}`, pending: 0 },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetUsers(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const url = new URL(req.url);
  const { skip, limit, search } = paginate(url);
  const role = url.searchParams.get('role') || undefined;

  const where = {
    ...(role ? { role } : {}),
    ...(search ? { OR: [
      { name:  { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ]} : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, avatar: true, phone: true },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return NextResponse.json({ success: true, users, total });
}

async function handlePatchUser(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
      ...(body.name ? { name: body.name } : {}),
      ...(body.role ? { role: body.role } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return NextResponse.json({ success: true, user });
}

async function handleDeleteUser(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Notes
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetNotes(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const url = new URL(req.url);
  const { skip, limit, search } = paginate(url);
  const where = search ? { OR: [
    { title:   { contains: search, mode: 'insensitive' as const } },
    { subject: { contains: search, mode: 'insensitive' as const } },
  ]} : {};

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      include: { teacher: { select: { user: { select: { name: true, email: true } } } }, _count: { select: { bookmarks: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.note.count({ where }),
  ]);
  return NextResponse.json({ success: true, notes, total });
}

async function handlePatchNote(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const body = await req.json();
  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(typeof body.isPublished === 'boolean' ? { isPublished: body.isPublished } : {}),
      ...(typeof body.isPinned    === 'boolean' ? { isPinned:    body.isPinned    } : {}),
    },
  });
  return NextResponse.json({ success: true, note });
}

async function handleDeleteNote(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Assignments
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetAssignments(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const url = new URL(req.url);
  const { skip, limit, search } = paginate(url);
  const where = search ? { OR: [
    { title:   { contains: search, mode: 'insensitive' as const } },
    { subject: { contains: search, mode: 'insensitive' as const } },
  ]} : {};

  const [assignments, total] = await Promise.all([
    (prisma as any).assignmentV2.findMany({
      where,
      include: { teacher: { select: { user: { select: { name: true } } } }, _count: { select: { submissions: true, comments: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    (prisma as any).assignmentV2.count({ where }),
  ]);
  return NextResponse.json({ success: true, assignments, total });
}

async function handleDeleteAssignment(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  await (prisma as any).assignmentV2.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Doubts
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetDoubts(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const url = new URL(req.url);
  const { skip, limit, search } = paginate(url);
  const status = url.searchParams.get('status') || undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(search ? { OR: [
      { title:   { contains: search, mode: 'insensitive' as const } },
      { subject: { contains: search, mode: 'insensitive' as const } },
    ]} : {}),
  };

  const [doubts, total] = await Promise.all([
    prisma.doubt.findMany({
      where,
      include: { student: { select: { user: { select: { name: true, email: true } } } }, _count: { select: { replies: true, upvotedBy: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.doubt.count({ where }),
  ]);
  return NextResponse.json({ success: true, doubts, total });
}

async function handlePatchDoubt(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const body  = await req.json();
  const doubt = await prisma.doubt.update({
    where: { id },
    data: {
      ...(typeof body.isSolved === 'boolean' ? {
        isSolved: body.isSolved,
        status:   body.isSolved ? 'solved' : 'open',
        solvedAt: body.isSolved ? new Date() : null,
      } : {}),
      ...(body.status ? { status: body.status } : {}),
    },
  });
  return NextResponse.json({ success: true, doubt });
}

async function handleDeleteDoubt(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  await prisma.doubt.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Videos (folders)
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetVideos(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const url = new URL(req.url);
  const { skip, limit, search } = paginate(url);
  const where = search ? { OR: [
    { name:    { contains: search, mode: 'insensitive' as const } },
    { subject: { contains: search, mode: 'insensitive' as const } },
  ]} : {};

  const [folders, total] = await Promise.all([
    prisma.videoFolder.findMany({
      where,
      include: {
        teacher: { select: { user: { select: { name: true } } } },
        _count:  { select: { videos: true } },
        videos:  { select: { id: true, title: true, views: true, duration: true }, orderBy: { uploadDate: 'desc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.videoFolder.count({ where }),
  ]);
  return NextResponse.json({ success: true, folders, total });
}

async function handleDeleteVideoFolder(req: NextRequest, id: string) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  await prisma.videoFolder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Payments
// ─────────────────────────────────────────────────────────────────────────────

async function handleGetPayments(req: NextRequest) {
  if (!verifyToken(bearerToken(req))) return unauthorized();
  const url = new URL(req.url);
  const { skip, limit, search } = paginate(url);
  const status = url.searchParams.get('status') || undefined;
  const where = {
    ...(status ? { status } : {}),
    ...(search ? { OR: [
      { orderId:   { contains: search, mode: 'insensitive' as const } },
      { paymentId: { contains: search, mode: 'insensitive' as const } },
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
      { user: { name:  { contains: search, mode: 'insensitive' as const } } },
    ]} : {}),
  };

  const [payments, total, revenueAgg] = await Promise.all([
    (prisma as any).paymentOrder.findMany({
      where,
      include: { user: { select: { name: true, email: true, avatar: true } }, items: true },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    (prisma as any).paymentOrder.count({ where }),
    (prisma as any).paymentOrder.aggregate({ where: { status: 'paid' }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    success: true,
    payments,
    total,
    totalRevenue: `₹${(revenueAgg._sum?.amount ?? 0).toLocaleString('en-IN')}`,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Router — Next.js 15 catch-all with async params
// ─────────────────────────────────────────────────────────────────────────────

type Ctx = { params: Promise<{ slug?: string[] }> };

function resolve(slug: string[]) {
  return { resource: slug[0] ?? '', id: slug[1] ?? null };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug = [] } = await ctx.params;
  const { resource, id } = resolve(slug);
  try {
    switch (resource) {
      case 'auth':        return handleVerify(req);
      case 'stats':       return handleStats(req);
      case 'users':       return id ? notFound() : handleGetUsers(req);
      case 'notes':       return id ? notFound() : handleGetNotes(req);
      case 'assignments': return id ? notFound() : handleGetAssignments(req);
      case 'doubts':      return id ? notFound() : handleGetDoubts(req);
      case 'videos':      return id ? notFound() : handleGetVideos(req);
      case 'payments':    return id ? notFound() : handleGetPayments(req);
      default:            return notFound();
    }
  } catch (e: any) {
    console.error('[admin GET]', resource, id, e?.message);
    return err500('Internal server error');
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug = [] } = await ctx.params;
  const { resource } = resolve(slug);
  try {
    switch (resource) {
      case 'auth': return handleLogin(req);
      default:     return notFound();
    }
  } catch (e: any) {
    console.error('[admin POST]', resource, e?.message);
    return err500('Internal server error');
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { slug = [] } = await ctx.params;
  const { resource, id } = resolve(slug);
  if (!id) return notFound();
  try {
    switch (resource) {
      case 'users':  return handlePatchUser(req, id);
      case 'notes':  return handlePatchNote(req, id);
      case 'doubts': return handlePatchDoubt(req, id);
      default:       return notFound();
    }
  } catch (e: any) {
    console.error('[admin PATCH]', resource, id, e?.message);
    return err500('Internal server error');
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { slug = [] } = await ctx.params;
  const { resource, id } = resolve(slug);
  if (!id) return notFound();
  try {
    switch (resource) {
      case 'users':       return handleDeleteUser(req, id);
      case 'notes':       return handleDeleteNote(req, id);
      case 'assignments': return handleDeleteAssignment(req, id);
      case 'doubts':      return handleDeleteDoubt(req, id);
      case 'videos':      return handleDeleteVideoFolder(req, id);
      default:            return notFound();
    }
  } catch (e: any) {
    console.error('[admin DELETE]', resource, id, e?.message);
    return err500('Internal server error');
  }
}