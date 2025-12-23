'use client'

import { useState, useRef, useEffect, ReactNode, forwardRef } from 'react'

interface PremiumFeatureAccordionProps {
  title: string
  icon: string
  description: string
  children: ReactNode
  defaultOpen?: boolean
  isOpen?: boolean // Controlled mode
  onToggle?: (isOpen: boolean) => void // Controlled mode callback
}

const PREMIUM_BLUE = '#439FDD'
const PREMIUM_BLUE_LIGHT = '#e8f4fc'

const PremiumFeatureAccordion = forwardRef<HTMLDivElement, PremiumFeatureAccordionProps>(({
  title,
  icon,
  description,
  children,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
}, ref) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen)

  // Use controlled or uncontrolled mode
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle(!isOpen)
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children, isOpen])

  return (
    <div ref={ref} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-4">
      {/* Accordion Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-5 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${PREMIUM_BLUE_LIGHT} 0%, #d0e8f7 100%)` }}
        >
          <span className="text-3xl">{icon}</span>
        </div>

        {/* Title & Description */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 truncate">{description}</p>
        </div>

        {/* Chevron */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 flex-shrink-0"
          style={{
            backgroundColor: PREMIUM_BLUE_LIGHT,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: PREMIUM_BLUE }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Accordion Content */}
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-6 pb-6">
          <div
            className="border-t pt-6"
            style={{ borderColor: PREMIUM_BLUE_LIGHT }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
})

PremiumFeatureAccordion.displayName = 'PremiumFeatureAccordion'

export default PremiumFeatureAccordion
