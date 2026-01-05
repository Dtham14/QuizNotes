import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile check:', {
      userId: user.id,
      profile,
      profileError,
      role: profile?.role
    })

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    if (profile?.role !== 'admin') {
      console.log('User is not admin:', profile?.role)
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch all contact submissions
    console.log('Admin verified, fetching contact submissions...')

    const { data: submissions, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contact submissions:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions', details: error }, { status: 500 })
    }

    console.log(`Successfully fetched ${submissions?.length || 0} contact submissions`)

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error in contact submissions endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
