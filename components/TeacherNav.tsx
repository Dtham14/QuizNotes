'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

export default function TeacherNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/teacher') {
      return pathname === '/teacher' || pathname.startsWith('/teacher/classes');
    }
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-brand/20 text-brand'
        : 'text-gray-600 hover:text-brand hover:bg-gray-50'
    }`;

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/teacher" className="flex items-center gap-2">
            <Image
              src="/images/quiznotes logo.jpg"
              alt="QuizNotes Logo"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-bold text-brand cursor-pointer">QuizNotes Teacher</h1>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/teacher" className={linkClass('/teacher')}>
              Classes
            </Link>
            <Link href="/teacher/quizzes" className={linkClass('/teacher/quizzes')}>
              Quizzes
            </Link>
            <Link href="/teacher/assignments" className={linkClass('/teacher/assignments')}>
              Assignments
            </Link>
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
