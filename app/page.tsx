import { getSession } from '@/lib/auth';
import LandingPageClient from '@/components/LandingPageClient';

export default async function Home() {
  const user = await getSession();

  return <LandingPageClient user={user} />;
}
