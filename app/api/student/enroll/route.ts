import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classes, classEnrollments, users } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Class code is required' }, { status: 400 });
    }

    // Find the class by code
    const [classToJoin] = await db
      .select()
      .from(classes)
      .where(eq(classes.code, code.toUpperCase()))
      .limit(1);

    if (!classToJoin) {
      return NextResponse.json({ error: 'Invalid class code' }, { status: 404 });
    }

    // Check if already enrolled
    const [existingEnrollment] = await db
      .select()
      .from(classEnrollments)
      .where(
        and(
          eq(classEnrollments.classId, classToJoin.id),
          eq(classEnrollments.studentId, user.id)
        )
      )
      .limit(1);

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 });
    }

    // Enroll the student
    await db.insert(classEnrollments).values({
      classId: classToJoin.id,
      studentId: user.id,
    });

    return NextResponse.json({ message: 'Successfully enrolled', class: classToJoin }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enroll' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    // Get all classes the student is enrolled in with teacher information
    const enrollments = await db
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        code: classes.code,
        teacherName: users.name,
        createdAt: classes.createdAt,
      })
      .from(classEnrollments)
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .innerJoin(users, eq(classes.teacherId, users.id))
      .where(eq(classEnrollments.studentId, user.id));

    return NextResponse.json({ classes: enrollments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}
