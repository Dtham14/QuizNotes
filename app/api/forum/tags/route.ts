import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * GET /api/forum/tags
 * Get all forum tags
 * Public endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    const { data: tags, error } = await supabase
      .from('forum_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error in GET /api/forum/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
