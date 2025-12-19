import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/types/database'

// Service role client for bypassing RLS when fetching own profile
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  return createSupabaseClient(url, key)
}

export type UserWithProfile = {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'teacher' | 'student'
  subscription_status: 'none' | 'active' | 'canceled' | 'expired'
  subscription_plan: 'monthly' | 'yearly' | null
  subscription_expires_at: string | null
  stripe_customer_id: string | null
  created_at: string
}

/**
 * Get the current user session with profile data
 * Returns null if not authenticated
 */
export async function getSession(): Promise<UserWithProfile | null> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      // "Auth session missing!" is expected when not logged in - don't log as error
      if (authError.message !== 'Auth session missing!') {
        console.error('Auth error in getSession:', authError.message)
      }
      return null
    }

    if (!user) {
      return null
    }

    // Use service role to bypass RLS policies (avoids infinite recursion)
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error in getSession:', profileError.message)
      return null
    }

    if (!profile) {
      console.error('No profile found for user:', user.id)
      return null
    }

    return profile as UserWithProfile
  } catch (error) {
    console.error('Exception in getSession:', error)
    return null
  }
}

/**
 * Require authentication - throws redirect if not logged in
 * Use in Server Components and API routes
 */
export async function requireAuth(): Promise<UserWithProfile> {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Check if a user has an active subscription
 */
export function hasActiveSubscription(user: {
  subscription_status?: string | null
  subscription_expires_at?: string | null
}): boolean {
  if (user.subscription_status !== 'active') {
    return false
  }

  // Check if subscription has expired
  if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
    return false
  }

  return true
}

/**
 * Require teacher role with active subscription
 * Admins bypass subscription check
 */
export async function requireTeacherSubscription(): Promise<UserWithProfile> {
  const user = await requireAuth()

  // Check role
  if (user.role !== 'teacher' && user.role !== 'admin') {
    redirect('/dashboard')
  }

  // Admins bypass subscription check
  if (user.role === 'admin') {
    return user
  }

  // Teachers need active subscription
  if (!hasActiveSubscription(user)) {
    redirect('/pricing?reason=subscription_required')
  }

  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<UserWithProfile> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    redirect('/dashboard')
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
