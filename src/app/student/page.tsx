'use client';

import ProtectedLanding from '../../components/Landing page/LandingPage'; // or wherever your component is
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function StudentDashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/');
  }

  return <ProtectedLanding />;
}