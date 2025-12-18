import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { quizAttempts } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { quizType, score, totalQuestions, answers } = await request.json();

    if (!quizType || score === undefined || !totalQuestions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: user.id,
        quizType,
        score,
        totalQuestions,
        answers: JSON.stringify(answers),
      })
      .returning();

    return NextResponse.json(
      { message: 'Quiz submitted successfully', attempt },
      { status: 201 }
    );
  } catch (error) {
    console.error('Quiz submission error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
