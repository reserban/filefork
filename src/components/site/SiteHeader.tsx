'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { HelpCircle, Menu, MessageSquarePlus, Star } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Brand } from './Brand'
import { GithubMark } from './GithubMark'
import { HowItWorksModal } from './HowItWorksModal'

const GITHUB_URL = 'https://github.com/reserban/filefork'
const FEEDBACK_EMAIL = 'filefork@unzet.com'

// Prefilled mailto so users only need to fill in the blanks.
const FEATURE_MAILTO = (() => {
  const subject = 'FileFork — feature request'
  const body = [
    'Hi FileFork team,',
    '',
    'I\'d love to see this added or improved:',
    '',
    '— What you want:',
    '',
    '— Why it matters to you:',
    '',
    '— Files / formats involved (optional):',
    '',
    'Thanks!',
  ].join('\n')
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})()

/**
 * Sticky top bar with the FileFork brand on the left and the
 * How-it-works + Request-feature + Star-on-GitHub + theme toggle cluster on the right.
 * On mobile the cluster collapses into a hamburger that opens a left Sheet.
 */
export function SiteHeader() {
  const [howOpen, setHowOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  // Defer Radix Sheet to post-mount: Radix generates aria-controls via useId(),
  // and even a small drift in earlier useId() calls between SSR and hydration
  // causes the trigger's aria-controls to mismatch. Rendering a plain button
  // for the first paint (identical server/client) avoids that class of issue.
  const [mounted, setMounted] = useState(false)
  // One-time mount gate so the Radix Sheet only renders on the client (see
  // comment above). The setState fires exactly once per mount — no cascade.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  // Clicking the logo on the dashboard resets state back to the hero.
  // Modifier-clicks (cmd/ctrl/middle) fall through to the Link's normal
  // navigation so "open in new tab" still works.
  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    window.dispatchEvent(new CustomEvent('filefork:reset'))
  }

  return (
    <header className="border-b border-border backdrop-blur bg-background/70 sticky top-0 z-60">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 pl-5 h-14">
        <Link
          href="/"
          onClick={handleBrandClick}
          aria-label="FileFork — reset"
          className="flex items-center"
        >
          <Brand width={113} priority />
        </Link>

        {/* Desktop: inline button row */}
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHowOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="How FileFork works"
            title="How FileFork works"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={2} />
            <span>How it works</span>
          </button>
          <a
            href={FEATURE_MAILTO}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Request a feature"
            title="Request a feature"
          >
            <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
            <span>Request feature</span>
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Star FileFork on GitHub"
            title="Star FileFork on GitHub"
          >
            <GithubMark className="h-4 w-4" />
            <span>Star on GitHub</span>
          </a>
          <ThemeToggle />
        </div>

        {/* Mobile: hamburger menu opens a left sheet */}
        <div className="flex md:hidden items-center gap-0.5">
          <ThemeToggle />
          {!mounted ? (
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Menu className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : (
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Menu className="h-5 w-5" strokeWidth={2} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[82vw] max-w-xs p-0 flex flex-col top-14 bottom-0 h-[calc(100dvh-3.5rem)] border-t border-border"
              overlayClassName="top-14 bottom-0 inset-x-0 inset-y-auto h-[calc(100dvh-3.5rem)]"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Site navigation</SheetTitle>
                <SheetDescription>
                  How it works, request a feature, or star FileFork on GitHub.
                </SheetDescription>
              </SheetHeader>

              <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setNavOpen(false)
                    setHowOpen(true)
                  }}
                  className="inline-flex items-center gap-3 h-11 px-3 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" strokeWidth={2} />
                  How it works
                </button>
                <a
                  href={FEATURE_MAILTO}
                  onClick={() => setNavOpen(false)}
                  className="inline-flex items-center gap-3 h-11 px-3 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
                  Request feature
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setNavOpen(false)}
                  className="inline-flex items-center gap-3 h-11 px-3 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Star className="h-4 w-4" strokeWidth={2} />
                  Star on GitHub
                </a>
              </nav>

              <div className="border-t border-border px-5 py-3 text-[11px] font-mono tracking-[0.12em] uppercase text-muted-foreground/70 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Files stay on your device
              </div>
            </SheetContent>
          </Sheet>
          )}
        </div>
      </div>

      <HowItWorksModal open={howOpen} onClose={() => setHowOpen(false)} />
    </header>
  )
}
