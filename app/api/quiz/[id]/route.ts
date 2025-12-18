import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customQuizzes } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;

    const quiz = await db
      .select()
      .from(customQuizzes)
      .where(eq(customQuizzes.id, id))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ quiz: quiz[0] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
