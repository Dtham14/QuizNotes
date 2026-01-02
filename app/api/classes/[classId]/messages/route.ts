import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service role client to bypass RLS policies
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(url, key)
}

// GET - Fetch all messages for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params
    const supabase = await createClient()
    const supabaseAdmin = getSupabaseAdmin()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this class (either teacher or enrolled student)
    // Use admin client to bypass RLS
    const { data: classData } = await supabaseAdmin
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    const isTeacher = classData?.teacher_id === user.id

    if (!isTeacher) {
      // Check if student is enrolled (use admin client to bypass RLS)
      const { data: enrollment } = await supabaseAdmin
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

    // Fetch messages with user profile information (use admin client to bypass RLS)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('class_messages')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_message_id,
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
        parentMessageId: msg.parent_message_id,
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
    const supabaseAdmin = getSupabaseAdmin()

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
    const { content, parentMessageId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this class (use admin client to bypass RLS)
    const { data: classData } = await supabaseAdmin
      .from('classes')
      .select('teacher_id')
      .eq('id', classId)
      .single()

    const isTeacher = classData?.teacher_id === user.id

    if (!isTeacher) {
      // Check if student is enrolled (use admin client to bypass RLS)
      const { data: enrollment } = await supabaseAdmin
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

    // Insert the message (use admin client to bypass RLS)
    const insertData: any = {
      class_id: classId,
      user_id: user.id,
      content: content.trim(),
    }

    // Add parent message ID if this is a reply
    if (parentMessageId) {
      insertData.parent_message_id = parentMessageId
    }

    const { data: newMessage, error: insertError } = await supabaseAdmin
      .from('class_messages')
      .insert(insertData)
      .select(`
        id,
        content,
        created_at,
        updated_at,
        parent_message_id,
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
      parentMessageId: newMessage.parent_message_id,
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
