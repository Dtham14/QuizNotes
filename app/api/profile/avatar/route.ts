import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'

const VALID_AVATARS = [
  'treble-clef', 'bass-clef', 'quarter-note', 'eighth-notes',
  'piano', 'guitar', 'violin', 'trumpet', 'microphone',
  'headphones', 'composer', 'conductor'
]

export async function PUT(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { avatar } = body

    if (!avatar || !VALID_AVATARS.includes(avatar)) {
      return NextResponse.json({ error: 'Invalid avatar' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('profiles')
      .update({ avatar })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating avatar:', error)
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, avatar })
  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}
