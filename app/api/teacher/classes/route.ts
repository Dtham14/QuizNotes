import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSession, hasActiveSubscription } from '@/lib/auth'

// Service role client to bypass RLS policies
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(url, key)
}

// Helper to generate class code
function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'teacher' && !hasActiveSubscription(user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const supabase = getSupabaseAdmin()

    // Get classes with student count
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_enrollments(count)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching classes:', error)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Transform data to include student count
    const classesWithCounts = classes.map((cls) => ({
      id: cls.id,
      teacherId: cls.teacher_id,
      name: cls.name,
      description: cls.description,
      code: cls.code,
      createdAt: cls.created_at,
      studentCount: cls.class_enrollments[0]?.count || 0,
    }))

    return NextResponse.json({ classes: classesWithCounts })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'teacher' && !hasActiveSubscription(user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Generate unique class code
    const code = generateClassCode()

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        teacher_id: user.id,
        name,
        description: description || null,
        code,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
    }

    return NextResponse.json({
      class: {
        id: newClass.id,
        teacherId: newClass.teacher_id,
        name: newClass.name,
        description: newClass.description,
        code: newClass.code,
        createdAt: newClass.created_at,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create class' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'teacher' && !hasActiveSubscription(user)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 402 })
    }

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify the class belongs to the teacher
    const { data: classToDelete } = await supabase
      .from('classes')
      .select()
      .eq('id', classId)
      .eq('teacher_id', user.id)
      .single()

    if (!classToDelete) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId)

    if (error) {
      console.error('Error deleting class:', error)
      return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete class' },
      { status: 500 }
    )
  }
}
