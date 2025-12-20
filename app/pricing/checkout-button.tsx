'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  plan: 'monthly' | 'yearly' | 'student_premium'
  variant: 'primary' | 'secondary'
}

const planLabels: Record<string, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
  student_premium: 'Premium',
}

export function CheckoutButton({ plan, variant }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const baseClasses = 'w-full py-4 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variantClasses = variant === 'primary'
    ? 'bg-brand text-white hover:bg-brand-dark'
    : 'bg-gray-900 text-white hover:bg-gray-800'

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`${baseClasses} ${variantClasses}`}
    >
      {loading ? 'Processing...' : `Subscribe ${planLabels[plan] || plan}`}
    </button>
  )
}
