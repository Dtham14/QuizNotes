import { getSession } from '@/lib/auth';
import LandingPageClient from '@/components/LandingPageClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getSession();

  return <LandingPageClient user={user} />;
}
