import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Price IDs from Stripe Dashboard
// You'll need to create these products/prices in Stripe and update these IDs
const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder',
  student_premium: process.env.STRIPE_STUDENT_PREMIUM_PRICE_ID || 'price_student_premium_placeholder',
}

// Success redirect URLs based on plan type
const SUCCESS_URLS = {
  monthly: '/teacher?success=true',
  yearly: '/teacher?success=true',
  student_premium: '/profile?success=true',
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan || !['monthly', 'yearly', 'student_premium'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]
    const successPath = SUCCESS_URLS[plan as keyof typeof SUCCESS_URLS]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}${successPath}`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
