import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assignments, classes, classEnrollments, customQuizzes } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await requireAuth();

    // Get all assignments for classes the student is enrolled in
    const studentAssignments = await db
      .select({
        id: assignments.id,
        classId: assignments.classId,
        className: classes.name,
        quizId: assignments.quizId,
        quizType: assignments.quizType,
        title: assignments.title,
        description: assignments.description,
        dueDate: assignments.dueDate,
        createdAt: assignments.createdAt,
      })
      .from(classEnrollments)
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .innerJoin(assignments, eq(classes.id, assignments.classId))
      .where(eq(classEnrollments.studentId, user.id));

    return NextResponse.json({ assignments: studentAssignments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
