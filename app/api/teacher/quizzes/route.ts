import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customQuizzes } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const quizzes = await db
      .select()
      .from(customQuizzes)
      .where(eq(customQuizzes.teacherId, user.id));

    return NextResponse.json({ quizzes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, description, questions } = await request.json();

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title and questions are required' },
        { status: 400 }
      );
    }

    const [newQuiz] = await db
      .insert(customQuizzes)
      .values({
        teacherId: user.id,
        title,
        description: description || null,
        questions: JSON.stringify(questions),
      })
      .returning();

    return NextResponse.json({ quiz: newQuiz }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth();

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { quizId } = await request.json();

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID is required' }, { status: 400 });
    }

    // Verify the quiz belongs to this teacher
    const [quiz] = await db
      .select()
      .from(customQuizzes)
      .where(
        and(
          eq(customQuizzes.id, quizId),
          eq(customQuizzes.teacherId, user.id)
        )
      )
      .limit(1);

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    await db.delete(customQuizzes).where(eq(customQuizzes.id, quizId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}
