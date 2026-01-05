import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import TeacherNav from '@/components/TeacherNav';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Redirect if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Redirect if not a teacher or admin
  if (user.role !== 'teacher' && user.role !== 'admin') {
    redirect('/student/dashboard');
  }

  // Fetch teacher stats for navigation
  const supabase = await createClient();

  // First get the teacher's class IDs
  const { data: teacherClasses } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id);

  const classIds = teacherClasses?.map(c => c.id) || [];

  const [classesResult, studentsResult, quizzesResult, assignmentsResult] = await Promise.all([
    supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id),
    classIds.length > 0
      ? supabase
          .from('class_enrollments')
          .select('id', { count: 'exact', head: true })
          .in('class_id', classIds)
      : { count: 0 },
    supabase
      .from('custom_quizzes')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id),
    supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id),
  ]);

  const stats = {
    classCount: classesResult.count || 0,
    studentCount: studentsResult.count || 0,
    quizCount: quizzesResult.count || 0,
    assignmentCount: assignmentsResult.count || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNav user={user} stats={stats} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
