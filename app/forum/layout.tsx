import { getSession } from '@/lib/auth';
import StudentNav from '@/components/StudentNav';
import TeacherNav from '@/components/TeacherNav';
import ForumNav from '@/components/ForumNav';

export const dynamic = 'force-dynamic';

export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // Show role-appropriate nav when logged in
  if (user) {
    if (user.role === 'student') {
      return (
        <>
          <StudentNav user={user} />
          {children}
        </>
      );
    } else if (user.role === 'teacher' || user.role === 'admin') {
      return (
        <>
          <TeacherNav user={user} />
          {children}
        </>
      );
    }
  }

  // Show ForumNav for unauthenticated users
  return (
    <>
      <ForumNav user={user} />
      {children}
    </>
  );
}
