import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'

// Service role client to bypass RLS policies
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(url, key)
}

export async function POST(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Class code is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Find the class by code
    const { data: classToJoin } = await supabase
      .from('classes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (!classToJoin) {
      return NextResponse.json({ error: 'Invalid class code' }, { status: 404 })
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('class_enrollments')
      .select()
      .eq('class_id', classToJoin.id)
      .eq('student_id', user.id)
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Already enrolled in this class' }, { status: 400 })
    }

    // Enroll the student
    const { error } = await supabase
      .from('class_enrollments')
      .insert({
        class_id: classToJoin.id,
        student_id: user.id,
      })

    if (error) {
      console.error('Error enrolling:', error)
      return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Successfully enrolled',
      class: {
        id: classToJoin.id,
        name: classToJoin.name,
        description: classToJoin.description,
        code: classToJoin.code,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enroll' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get all classes the student is enrolled in with teacher information
    const { data: enrollments, error } = await supabase
      .from('class_enrollments')
      .select(`
        classes(
          id,
          name,
          description,
          code,
          created_at,
          profiles(name)
        )
      `)
      .eq('student_id', user.id)

    if (error) {
      console.error('Error fetching enrollments:', error)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Transform the data
    const classes = enrollments
      .map((e) => e.classes)
      .filter(Boolean)
      .map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        description: cls.description,
        code: cls.code,
        teacherName: cls.profiles?.name,
        createdAt: cls.created_at,
      }))

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}
