'use client';

import TeacherInterface from '../../components/Teacher Landing page/TeacherLandingPage';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function TeacherDashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // ✅ Only teachers can access teacher dashboard
  if (!session || session.user.role !== 'TEACHER') {
    redirect('/');
  }

  return <TeacherInterface />;
}