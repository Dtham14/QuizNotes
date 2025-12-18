import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes, classEnrollments, users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const teacherClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.teacherId, user.id));

    // Get student count for each class
    const classesWithCounts = await Promise.all(
      teacherClasses.map(async (cls) => {
        const enrollments = await db
          .select()
          .from(classEnrollments)
          .where(eq(classEnrollments.classId, cls.id));

        return {
          ...cls,
          studentCount: enrollments.length,
        };
      })
    );

    return NextResponse.json({ classes: classesWithCounts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch classes' },
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Generate a unique 6-character code
    const code = createId().slice(0, 6).toUpperCase();

    const [newClass] = await db
      .insert(classes)
      .values({
        teacherId: user.id,
        name,
        description: description || null,
        code,
      })
      .returning();

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create class' },
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

    const { classId } = await request.json();

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Verify the class belongs to the teacher
    const [classToDelete] = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (!classToDelete || classToDelete.teacherId !== user.id) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    await db.delete(classes).where(eq(classes.id, classId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete class' },
      { status: 500 }
    );
  }
}
