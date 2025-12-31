'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToDashboard() {
      try {
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        const data = await res.json();
        const user = data.user;

        // Redirect based on role
        if (user.role === 'teacher' || user.role === 'admin') {
          router.push('/teacher/dashboard');
        } else if (user.role === 'student') {
          router.push('/student/dashboard');
        } else {
          // Fallback to login if role is unknown
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      }
    }

    redirectToDashboard();
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}
