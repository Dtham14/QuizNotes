import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Missing attempt ID' },
        { status: 400 }
      );
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

    const currentDownloads = downloadCount || 0;

    // Check if limit exceeded
    if (currentDownloads >= dailyLimit) {
      return NextResponse.json(
        {
          error: 'Daily download limit reached',
          limit: dailyLimit,
          used: currentDownloads,
          isPremium,
          upgradeMessage: isPremium
            ? 'You have reached your daily limit of 20 downloads.'
            : 'Upgrade to Premium for 20 downloads per day!',
        },
        { status: 429 }
      );
    }

    // Get the quiz attempt and verify ownership
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, user_id, pdf_url')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Quiz attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - not your quiz attempt' },
        { status: 403 }
      );
    }

    // Always generate a fresh signed URL (bucket is private)
    const filePath = `${user.id}/${attemptId}.pdf`;

    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('quiz-results')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      // Check if the PDF exists at all
      const { data: fileList } = await supabaseAdmin
        .storage
        .from('quiz-results')
        .list(user.id, { search: `${attemptId}.pdf` });

      const fileExists = fileList && fileList.some(f => f.name === `${attemptId}.pdf`);

      return NextResponse.json(
        {
          error: fileExists ? 'Failed to generate download URL' : 'PDF not found - please regenerate from quiz results',
          details: signedUrlError?.message
        },
        { status: 404 }
      );
    }

    const pdfUrl = signedUrlData.signedUrl;

    // Track the download
    await supabaseAdmin.from('pdf_downloads').insert({
      user_id: user.id,
      attempt_id: attemptId,
    });

    return NextResponse.json({
      url: pdfUrl,
      downloadsUsed: currentDownloads + 1,
      dailyLimit,
      isPremium,
    });
  } catch (error) {
    console.error('Error getting PDF URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
