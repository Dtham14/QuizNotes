import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assignments, classes } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all assignments for this teacher's classes
    const teacherAssignments = await db
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
      .from(assignments)
      .innerJoin(classes, eq(assignments.classId, classes.id))
      .where(eq(assignments.teacherId, user.id));

    return NextResponse.json({ assignments: teacherAssignments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch assignments' },
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

    const { classId, quizId, quizType, title, description, dueDate } = await request.json();

    if (!classId || !title || (!quizId && !quizType)) {
      return NextResponse.json(
        { error: 'Class, title, and either quizId or quizType are required' },
        { status: 400 }
      );
    }

    // Verify the class belongs to this teacher
    const [teacherClass] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
      .limit(1);

    if (!teacherClass) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const [newAssignment] = await db
      .insert(assignments)
      .values({
        classId,
        teacherId: user.id,
        quizId: quizId || null,
        quizType: quizType || null,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create assignment' },
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

    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Verify the assignment belongs to this teacher
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(and(eq(assignments.id, assignmentId), eq(assignments.teacherId, user.id)))
      .limit(1);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
