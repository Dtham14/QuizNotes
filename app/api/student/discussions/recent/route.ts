import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createClient();

    // Get all classes the student is enrolled in
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('class_id')
      .eq('student_id', user.id);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    const classIds = enrollments.map(e => e.class_id);

    // Get recent messages from all enrolled classes
    const { data: messages, error } = await supabase
      .from('class_messages')
      .select(`
        id,
        content,
        created_at,
        class_id,
        classes!inner(name),
        profiles!inner(name, role)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      created_at: msg.created_at,
      class_id: msg.class_id,
      class_name: msg.classes.name,
      user_name: msg.profiles.name,
      user_role: msg.profiles.role,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error in recent discussions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
