import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from "@/lib/getSessionUser";

// What a student is allowed to see about a teacher (the "Our Teachers" directory). No contact details.
const PUBLIC_TEACHER_FIELDS = {
  id: true, name: true, role: true, avatar: true, bio: true, qualification: true,
  experience: true, subjects: true, specialization: true, teachingStyle: true,
  isActive: true, createdAt: true,
} as const;

// Everything a teacher/admin may see (student management screens).
const STAFF_FIELDS = {
  id: true, name: true, email: true, role: true, avatar: true, phone: true, bio: true,
  location: true, dateOfBirth: true, qualification: true, experience: true, subjects: true,
  specialization: true, teachingStyle: true, website: true, linkedin: true, twitter: true,
  instagram: true, isActive: true, createdAt: true, updatedAt: true,
  student: { select: { grade: true } }, // class, for the teacher's student directory
} as const;

const toInt = (v: string | null, fallback: number, lo: number, hi: number) => {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStaff = session.user.role === 'TEACHER' || session.user.role === 'ADMIN';

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').slice(0, 80);
    const limit = toInt(searchParams.get('limit'), 100, 1, 200);
    const skip = toInt(searchParams.get('skip'), 0, 0, 100_000);

    // Students may only look at the teacher directory; the roster of other students is staff-only.
    const requestedRole = (searchParams.get('role') || 'STUDENT').toUpperCase();
    if (!isStaff && requestedRole !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Staff may ask for deactivated accounts too (?includeInactive=1) so the directory can show Active / Inactive.
    const includeInactive = isStaff && searchParams.get('includeInactive') === '1';
    const whereClause: any = includeInactive ? {} : { isActive: true };
    if (requestedRole !== 'ALL') whereClause.role = requestedRole;
    // Never list admin accounts to anyone through this endpoint
    else whereClause.role = { in: ['STUDENT', 'TEACHER'] };

    if (search) {
      whereClause.OR = isStaff
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
            { subjects: { contains: search, mode: 'insensitive' } },
          ]
        : [
            { name: { contains: search, mode: 'insensitive' } },
            { subjects: { contains: search, mode: 'insensitive' } },
          ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: isStaff ? STAFF_FIELDS : PUBLIC_TEACHER_FIELDS,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      users,
      total: totalCount,
      limit,
      skip,
      hasMore: skip + users.length < totalCount,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
