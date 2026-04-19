'use client'

import type { ReactNode } from 'react'

interface InfoTipProps {
  children: ReactNode
  align?: 'left' | 'right'
}

/**
 * Inline "?" tooltip — pure CSS hover/focus, no dependencies.
 * The help bubble appears under the ? icon on hover or keyboard focus.
 */
export function InfoTip({ children, align = 'left' }: InfoTipProps) {
  return (
    <span className="relative inline-flex items-center align-middle group/tip">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex items-center justify-center h-4 w-4 rounded-full border border-foreground/25 text-[10px] font-medium text-muted-foreground hover:border-foreground/60 hover:text-foreground focus:outline-none focus-visible:border-primary focus-visible:text-primary transition-colors"
      >
        ?
      </button>
      <span
        className={`pointer-events-none absolute top-full mt-1.5 z-50 w-64 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl px-3 py-2 text-xs leading-relaxed opacity-0 translate-y-1 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 group-hover/tip:translate-y-0 group-focus-within/tip:translate-y-0 transition-all duration-150 ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {children}
      </span>
    </span>
  )
}
