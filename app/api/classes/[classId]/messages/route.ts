import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all messages for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this class (either teacher or enrolled student)
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    const isTeacher = classData?.teacher_id === user.id

    if (!isTeacher) {
      // Check if student is enrolled
      const { data: enrollment } = await supabase
        .from('class_enrollments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .single()

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Not authorized to view this class' },
          { status: 403 }
        )
      }
    }

    // Fetch messages with user profile information
    const { data: messages, error: messagesError } = await supabase
      .from('class_messages')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:profiles!class_messages_user_id_fkey (
          id,
          name,
          email,
          role,
          avatar_url,
          theme_color
        )
      `)
      .eq('class_id', classId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Format messages for the frontend
    const formattedMessages = messages.map((msg: any) => {
      const userProfile = Array.isArray(msg.user) ? msg.user[0] : msg.user
      return {
        id: msg.id,
        author: userProfile?.name || userProfile?.email || 'Unknown',
        role: userProfile?.role || 'student',
        content: msg.content,
        timestamp: msg.created_at,
        avatar: userProfile?.avatar_url,
        themeColor: userProfile?.theme_color,
      }
    })

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error in GET /api/classes/[classId]/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this class
    const { data: classData } = await supabase
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    const isTeacher = classData?.teacher_id === user.id

    if (!isTeacher) {
      // Check if student is enrolled
      const { data: enrollment } = await supabase
        .from('class_enrollments')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', user.id)
        .single()

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Not authorized to post to this class' },
          { status: 403 }
        )
      }
    }

    // Insert the message
    const { data: newMessage, error: insertError } = await supabase
      .from('class_messages')
      .insert({
        class_id: classId,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:profiles!class_messages_user_id_fkey (
          id,
          name,
          email,
          role,
          avatar_url,
          theme_color
        )
      `)
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json(
        { error: 'Failed to post message' },
        { status: 500 }
      )
    }

    // Format the message for the frontend
    const userProfile = Array.isArray(newMessage.user) ? newMessage.user[0] : newMessage.user
    const formattedMessage = {
      id: newMessage.id,
      author: userProfile?.name || userProfile?.email || 'Unknown',
      role: userProfile?.role || 'student',
      content: newMessage.content,
      timestamp: newMessage.created_at,
      avatar: userProfile?.avatar_url,
      themeColor: userProfile?.theme_color,
    }

    return NextResponse.json({ message: formattedMessage }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/classes/[classId]/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
