import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'

export async function PUT(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    if (trimmedName.length < 1 || trimmedName.length > 50) {
      return NextResponse.json({ error: 'Name must be between 1 and 50 characters' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmedName })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating name:', error)
      return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
    }

    return NextResponse.json({ success: true, name: trimmedName })
  } catch (error) {
    console.error('Error updating name:', error)
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }
}
