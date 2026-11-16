import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { getSessionUser, forgetSessionUser } from "@/lib/getSessionUser";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        qualification: true,
        experience: true,
        subjects: true,
        specialization: true,
        teachingStyle: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching own profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser(request);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Only fields the client actually sent are touched. (Before, omitting dateOfBirth wiped it.)
    const text = (key: string, max: number) =>
      key in body ? (body[key] === null || body[key] === '' ? null : String(body[key]).trim().slice(0, max)) : undefined;

    const data: Record<string, unknown> = {
      bio: text('bio', 1000),
      phone: text('phone', 20),
      location: text('location', 120),
      qualification: text('qualification', 200),
      experience: text('experience', 200),
      subjects: text('subjects', 300),
      specialization: text('specialization', 200),
      teachingStyle: text('teachingStyle', 500),
      website: text('website', 300),
      linkedin: text('linkedin', 300),
      twitter: text('twitter', 300),
      instagram: text('instagram', 300),
    };

    if ('name' in body) {
      const name = String(body.name ?? '').trim().slice(0, 80);
      if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      data.name = name;
    }

    // The login e-mail can't be changed from here: there is no verification step, so it would let a stolen
    // session hijack the account (or squat on someone else's address). Echoing the current value back is fine.
    if ('email' in body) {
      const email = String(body.email ?? '').trim().toLowerCase();
      if (email !== session.user.email.toLowerCase()) {
        return NextResponse.json({ error: "Email can't be changed here. Please contact support." }, { status: 400 });
      }
    }

    if (typeof data.phone === 'string') {
      const digits = data.phone.replace(/\D/g, '');
      if (!/^[+(\d][\d\s\-()]*$/.test(data.phone) || digits.length < 7 || digits.length > 15) {
        return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
      }
    }

    // Public links must be real http(s) URLs (they are rendered as tappable links elsewhere).
    for (const key of ['website', 'linkedin', 'twitter', 'instagram'] as const) {
      const v = data[key];
      if (typeof v !== 'string') continue;
      let ok = false;
      try { ok = /^https?:$/.test(new URL(v).protocol); } catch { ok = false; }
      if (!ok) return NextResponse.json({ error: `Enter a valid link for ${key} (starting with https://)` }, { status: 400 });
    }

    if ('dateOfBirth' in body) {
      if (!body.dateOfBirth) data.dateOfBirth = null;
      else {
        const d = new Date(body.dateOfBirth);
        if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() || d.getUTCFullYear() < 1940) {
          return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 });
        }
        data.dateOfBirth = d;
      }
    }

    if ('avatar' in body) {
      const avatar = body.avatar ? String(body.avatar).trim() : null;
      if (avatar && !/^https:\/\//i.test(avatar) && !avatar.startsWith('/')) {
        return NextResponse.json({ error: 'Invalid avatar URL' }, { status: 400 });
      }
      data.avatar = avatar && avatar.length <= 500 ? avatar : null;
    }

    // Drop anything left undefined so Prisma leaves those columns alone.
    for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
        dateOfBirth: true,
        qualification: true,
        experience: true,
        subjects: true,
        specialization: true,
        teachingStyle: true,
        website: true,
        linkedin: true,
        twitter: true,
        instagram: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
    });

    forgetSessionUser(session.user.id);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
