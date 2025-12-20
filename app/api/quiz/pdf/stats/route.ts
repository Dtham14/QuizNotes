import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Download limits
const FREE_DAILY_LIMIT = 5;
const PREMIUM_DAILY_LIMIT = 20;

// Create admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get user's subscription status
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const isPremium = profile?.subscription_status === 'active';
    const dailyLimit = isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

    // Get today's download count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { count: downloadCount } = await supabaseAdmin
      .from('pdf_downloads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('downloaded_at', today.toISOString())
      .lt('downloaded_at', tomorrow.toISOString());

    const downloadsUsed = downloadCount || 0;
    const downloadsRemaining = Math.max(0, dailyLimit - downloadsUsed);

    return NextResponse.json({
      downloadsUsed,
      downloadsRemaining,
      dailyLimit,
      isPremium,
    });
  } catch (error) {
    console.error('Error getting PDF stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
