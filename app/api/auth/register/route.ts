import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'student' } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['student', 'teacher']
    const userRole = validRoles.includes(role) ? role : 'student'

    const supabase = await createClient()

    // Check if this is the first user (make them admin)
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const isFirstUser = count === 0

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: isFirstUser ? 'admin' : userRole,
        },
      },
    })

    if (error) {
      // Handle specific error cases
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || email.split('@')[0],
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
