import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const { data: quiz, error } = await supabaseAdmin
      .from('custom_quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        teacherId: quiz.teacher_id,
        title: quiz.title,
        description: quiz.description,
        questions: quiz.questions,
        createdAt: quiz.created_at,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
