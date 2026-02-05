import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      bio,
      location,
      dateOfBirth,
      qualification,
      experience,
      subjects,
      specialization,
      teachingStyle,
      website,
      linkedin,
      twitter,
      instagram,
      avatar,
    } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phone,
        bio,
        location,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        qualification,
        experience,
        subjects,
        specialization,
        teachingStyle,
        website,
        linkedin,
        twitter,
        instagram,
        avatar,
        updatedAt: new Date(),
      },
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}