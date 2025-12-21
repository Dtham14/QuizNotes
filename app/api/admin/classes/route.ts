import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all teachers with their classes and student counts
    const { data: teachers, error: teachersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError);
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }

    // Get all classes with teacher info
    const { data: classes, error: classesError } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        name,
        description,
        code,
        created_at,
        teacher_id
      `)
      .order('created_at', { ascending: false });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Get all enrollments
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('class_enrollments')
      .select('class_id, student_id');

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError);
    }

    // Get student profiles for enrolled students
    const studentIds = [...new Set((enrollments || []).map(e => e.student_id))];
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .in('id', studentIds.length > 0 ? studentIds : ['none']);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    }

    // Create a map of students by ID
    const studentMap = new Map((students || []).map(s => [s.id, s]));

    // Create a map of enrollments by class
    const enrollmentsByClass = new Map<string, string[]>();
    (enrollments || []).forEach(e => {
      if (!enrollmentsByClass.has(e.class_id)) {
        enrollmentsByClass.set(e.class_id, []);
      }
      enrollmentsByClass.get(e.class_id)!.push(e.student_id);
    });

    // Create teacher map
    const teacherMap = new Map((teachers || []).map(t => [t.id, t]));

    // Build enriched classes data
    const enrichedClasses = (classes || []).map(c => {
      const teacher = teacherMap.get(c.teacher_id);
      const classStudentIds = enrollmentsByClass.get(c.id) || [];
      const classStudents = classStudentIds.map(sid => studentMap.get(sid)).filter(Boolean);

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        code: c.code,
        createdAt: c.created_at,
        teacher: teacher ? {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
        } : null,
        studentCount: classStudents.length,
        students: classStudents.map(s => ({
          id: s!.id,
          email: s!.email,
          name: s!.name,
        })),
      };
    });

    // Build teacher summary with their classes
    const teacherSummary = (teachers || []).map(t => {
      const teacherClasses = enrichedClasses.filter(c => c.teacher?.id === t.id);
      const totalStudents = teacherClasses.reduce((acc, c) => acc + c.studentCount, 0);

      return {
        id: t.id,
        email: t.email,
        name: t.name,
        createdAt: t.created_at,
        classCount: teacherClasses.length,
        totalStudents,
        classes: teacherClasses.map(c => ({
          id: c.id,
          name: c.name,
          studentCount: c.studentCount,
        })),
      };
    });

    return NextResponse.json({
      classes: enrichedClasses,
      teachers: teacherSummary,
      stats: {
        totalTeachers: teachers?.length || 0,
        totalClasses: classes?.length || 0,
        totalEnrollments: enrollments?.length || 0,
        totalUniqueStudents: studentIds.length,
      },
    });
  } catch (error) {
    console.error('Admin classes error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch class data' },
      { status: 500 }
    );
  }
}
