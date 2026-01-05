import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AssignmentsRedirectPage() {
  const user = await getSession();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Redirect based on role
  if (user.role === 'student') {
    redirect('/student/assignments');
  } else if (user.role === 'teacher' || user.role === 'admin') {
    redirect('/teacher/assignments');
  }

  // Default redirect if role is unknown
  redirect('/dashboard');
}
