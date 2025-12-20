import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

// Create admin client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File | null;
    const attemptId = formData.get('attemptId') as string | null;

    if (!pdfFile || !attemptId) {
      return NextResponse.json(
        { error: 'Missing PDF file or attempt ID' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify the user owns this quiz attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id, user_id')
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

    // Convert File to ArrayBuffer then Uint8Array for upload
    const arrayBuffer = await pdfFile.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Upload path: {user_id}/{attempt_id}.pdf
    const filePath = `${user.id}/${attemptId}.pdf`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('quiz-results')
      .upload(filePath, fileData, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get the public URL (or signed URL for private buckets)
    const { data: urlData } = supabaseAdmin
      .storage
      .from('quiz-results')
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;

    // Update the quiz attempt with the PDF URL
    const { error: updateError } = await supabaseAdmin
      .from('quiz_attempts')
      .update({ pdf_url: pdfUrl })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Error updating attempt with PDF URL:', updateError);
      // Don't fail the request, the PDF is uploaded
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      path: uploadData.path,
    });
  } catch (error) {
    console.error('Error in PDF upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
