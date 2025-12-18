import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { quizAttempts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await requireAuth();

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, user.id))
      .orderBy(desc(quizAttempts.createdAt));

    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('Fetch attempts error:', error);

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
