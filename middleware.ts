import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Service role client for bypassing RLS when checking subscription
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - IMPORTANT: must call getUser() to refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = [
    '/profile',
    '/teacher',
    '/achievements',
    '/leaderboard',
    '/forum/create', // Creating posts requires authentication
    '/forum/edit', // Editing posts requires authentication
  ]

  // Allow /quiz/daily for anonymous users, but protect /quiz (the main quiz page)
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  ) || (request.nextUrl.pathname.startsWith('/quiz') && !request.nextUrl.pathname.startsWith('/quiz/daily'))

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Teacher routes require teacher/admin role AND active subscription
  if (request.nextUrl.pathname.startsWith('/teacher') && user) {
    // Use service role to bypass RLS policies
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    // Check role
    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/profile'
      return NextResponse.redirect(url)
    }

    // Admins bypass subscription check
    if (profile?.role === 'admin') {
      return supabaseResponse
    }

    // Check active subscription for teachers
    const hasActiveSubscription =
      profile?.subscription_status === 'active' &&
      (!profile?.subscription_expires_at ||
        new Date(profile.subscription_expires_at) > new Date())

    if (!hasActiveSubscription) {
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      url.searchParams.set('reason', 'subscription_required')
      return NextResponse.redirect(url)
    }
  }

  // API routes for teacher also need protection
  if (request.nextUrl.pathname.startsWith('/api/teacher') && user) {
    // Use service role to bypass RLS policies
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (profile?.role !== 'admin') {
      const hasActiveSubscription =
        profile?.subscription_status === 'active' &&
        (!profile?.subscription_expires_at ||
          new Date(profile.subscription_expires_at) > new Date())

      if (!hasActiveSubscription) {
        return NextResponse.json(
          { error: 'Subscription required' },
          { status: 402 }
        )
      }
    }
  }

  // Forum moderation routes require teacher/admin role
  if (request.nextUrl.pathname.startsWith('/forum/moderation') && user) {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/forum'
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === '/login' && user) {
    // Redirect logged-in users to profile
    const url = request.nextUrl.clone()
    url.pathname = '/profile'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
