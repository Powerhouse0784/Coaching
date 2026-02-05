'use client';

import TeacherInterface from '../../components/Teacher Landing page/TeacherLandingPage';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }
    
    if (session.user.role !== 'TEACHER') {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading Teacher Portal...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'TEACHER') {
    return null;
  }

  return <TeacherInterface />;
}