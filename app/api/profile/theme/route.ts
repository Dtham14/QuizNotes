import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'

// Validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

export async function PUT(request: Request) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { themeColor } = body

    // Allow null to clear theme, or validate hex color
    if (themeColor !== null && !isValidHexColor(themeColor)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex color (e.g., #FF5733)' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('profiles')
      .update({ theme_color: themeColor })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating theme color:', error)
      return NextResponse.json({ error: 'Failed to update theme color' }, { status: 500 })
    }

    return NextResponse.json({ success: true, themeColor })
  } catch (error) {
    console.error('Error updating theme color:', error)
    return NextResponse.json({ error: 'Failed to update theme color' }, { status: 500 })
  }
}
