'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCompletePage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      // Check if there's a pending checkout plan
      const plan = localStorage.getItem('checkout_plan')

      if (plan && ['monthly', 'yearly', 'student_premium'].includes(plan)) {
        // Clear the stored plan
        localStorage.removeItem('checkout_plan')

        // Initiate checkout
        try {
          const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan }),
          })
          const data = await response.json()

          if (data.url) {
            window.location.href = data.url
            return
          }
        } catch (error) {
          console.error('Checkout error:', error)
        }
      }

      // Default: redirect to dashboard (will redirect to role-specific dashboard)
      router.push('/dashboard')
    }

    handleRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
