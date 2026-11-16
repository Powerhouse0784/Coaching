'use client';

import ProtectedLanding from '../../components/Landing page/LandingPage';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function StudentDashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // ✅ FIXED: Allow both STUDENT and TEACHER to access student view
  if (!session || (session.user.role !== 'STUDENT' && session.user.role !== 'TEACHER')) {
    redirect('/');
  }

  return <ProtectedLanding />;
}