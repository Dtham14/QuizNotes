import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import StudentNav from '@/components/StudentNav';
import { createClient } from '@/lib/supabase/server';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Redirect if not a student (admins can access, but teachers redirect to teacher dashboard)
  if (user.role === 'teacher') {
    redirect('/teacher/dashboard');
  }

  // Fetch student gamification data for navigation
  const supabase = await createClient();

  const { data: gamificationData } = await supabase
    .from('user_gamification')
    .select('total_xp, current_level')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav
        user={user}
        level={gamificationData?.current_level}
        xp={gamificationData?.total_xp}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
