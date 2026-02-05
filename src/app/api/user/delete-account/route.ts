import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        student: { select: { id: true } },
        teacher: { select: { id: true } },
      }
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Manual deletion to ensure all data is properly removed
    // 1. Delete VideoProgress
    await prisma.videoProgress.deleteMany({
      where: { userId },
    });

    // 2. Handle Student data
    if (userExists.student) {
      const studentId = userExists.student.id;

      // Delete submissions
      await prisma.submission.deleteMany({
        where: { studentId },
      });

      // Delete enrollments
      await prisma.enrollment.deleteMany({
        where: { studentId },
      });

      // Delete student
      await prisma.student.delete({
        where: { id: studentId },
      });
    }

    // 3. Handle Teacher data
    if (userExists.teacher) {
      const teacherId = userExists.teacher.id;

      // Get all courses for this teacher
      const courses = await prisma.course.findMany({
        where: { teacherId },
        select: { id: true },
      });

      // Delete course-related data
      for (const course of courses) {
        // Delete enrollments
        await prisma.enrollment.deleteMany({
          where: { courseId: course.id },
        });

        // Get modules
        const modules = await prisma.module.findMany({
          where: { courseId: course.id },
          select: { id: true },
        });

        // Delete lectures for each module
        for (const module of modules) {
          await prisma.lecture.deleteMany({
            where: { moduleId: module.id },
          });
        }

        // Delete modules
        await prisma.module.deleteMany({
          where: { courseId: course.id },
        });
      }

      // Delete courses
      await prisma.course.deleteMany({
        where: { teacherId },
      });

      // Get all assignments
      const assignments = await prisma.assignment.findMany({
        where: { teacherId },
        select: { id: true },
      });

      // Delete submissions for each assignment
      for (const assignment of assignments) {
        await prisma.submission.deleteMany({
          where: { assignmentId: assignment.id },
        });
      }

      // Delete assignments
      await prisma.assignment.deleteMany({
        where: { teacherId },
      });

      // Get all video folders
      const videoFolders = await prisma.videoFolder.findMany({
        where: { teacherId },
        select: { id: true },
      });

      // Delete videos and progress for each folder
      for (const folder of videoFolders) {
        // Get videos in this folder
        const videos = await prisma.video.findMany({
          where: { folderId: folder.id },
          select: { id: true },
        });

        // Delete video progress
        for (const video of videos) {
          await prisma.videoProgress.deleteMany({
            where: { videoId: video.id },
          });
        }

        // Delete videos
        await prisma.video.deleteMany({
          where: { folderId: folder.id },
        });
      }

      // Delete video folders
      await prisma.videoFolder.deleteMany({
        where: { teacherId },
      });

      // Delete teacher
      await prisma.teacher.delete({
        where: { id: teacherId },
      });
    }

    // 4. Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create response with success message
    const response = NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully',
      redirect: '/'
    });

    // Clear all NextAuth cookies to sign out the user
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });
    });

    return response;

  } catch (error: any) {
    console.error('Error deleting account:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete account due to foreign key constraints. Please contact support.' },
        { status: 409 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found or already deleted.' },
        { status: 404 }
      );
    }

    if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1003') {
      return NextResponse.json(
        { 
          error: 'Database connection error. Please check your internet connection.',
          code: 'DB_CONNECTION_FAILED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete account. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}