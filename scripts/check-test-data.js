// Script to check test data
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTestData() {
  console.log('\n=== Checking Test Data ===\n');

  // Get test student
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'teststudent@quiznotes.test')
    .single();

  if (!studentProfile) {
    console.log('Test student not found');
    return;
  }

  console.log('Test Student ID:', studentProfile.id);

  // Get test teacher
  const { data: teacherProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'testteacher@quiznotes.test')
    .single();

  if (!teacherProfile) {
    console.log('Test teacher not found');
    return;
  }

  console.log('Test Teacher ID:', teacherProfile.id);

  // Get teacher's classes
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherProfile.id);

  console.log('\nTeacher Classes:', classes?.length || 0);
  if (classes && classes.length > 0) {
    classes.forEach(c => {
      console.log(`  - ${c.name} (${c.code})`);
    });
  }

  // Get student enrollments
  const { data: enrollments } = await supabase
    .from('class_enrollments')
    .select('*, classes(*)')
    .eq('student_id', studentProfile.id);

  console.log('\nStudent Enrollments:', enrollments?.length || 0);
  if (enrollments && enrollments.length > 0) {
    enrollments.forEach(e => {
      console.log(`  - ${e.classes.name} (${e.classes.code})`);
      console.log(`    Class ID: ${e.class_id}`);
    });
  } else {
    console.log('No enrollments found for test student');
  }

  // If there's a class but no enrollment, create one
  if (classes && classes.length > 0 && (!enrollments || enrollments.length === 0)) {
    console.log('\nCreating test enrollment...');
    const { data: newEnrollment, error } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classes[0].id,
        student_id: studentProfile.id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating enrollment:', error);
    } else {
      console.log('✓ Test student enrolled in:', classes[0].name);
      console.log('  Class ID:', classes[0].id);
    }
  }

  // If no class exists, create one
  if (!classes || classes.length === 0) {
    console.log('\nCreating test class...');

    // Generate a random 6-character class code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        teacher_id: teacherProfile.id,
        name: 'Test Music Theory Class',
        description: 'A test class for testing student access',
        code: code
      })
      .select('*')
      .single();

    if (classError) {
      console.error('Error creating class:', classError);
    } else {
      console.log('✓ Test class created:', newClass.name);
      console.log('  Class Code:', newClass.code);
      console.log('  Class ID:', newClass.id);

      // Enroll the test student
      const { data: newEnrollment, error: enrollError } = await supabase
        .from('class_enrollments')
        .insert({
          class_id: newClass.id,
          student_id: studentProfile.id
        })
        .select('*')
        .single();

      if (enrollError) {
        console.error('Error enrolling student:', enrollError);
      } else {
        console.log('✓ Test student enrolled in class');
      }
    }
  }

  console.log('\n');
}

checkTestData().catch(console.error);
