'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Cpu, FileDown, Github, Layers, Package, Scissors, ShieldCheck, Sparkles, Sliders, X } from 'lucide-react'

interface HowItWorksModalProps {
  open: boolean
  onClose: () => void
}

const GITHUB_URL = 'https://github.com/reserban/filefork'

/**
 * Backdrop modal explaining the FileFork pipeline. Portaled to document.body
 * so it centers on the viewport — the parent header uses `backdrop-blur`,
 * which creates a containing block that would otherwise capture `fixed`
 * children. Closes on ESC or backdrop click.
 */
export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  const [mounted, setMounted] = useState(false)
  // One-time mount gate so the portal target (document.body) is only used on
  // the client. The setState fires exactly once per mount — no cascade risk.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)

    // Lock body scroll without layout shift: pad the body by the scrollbar
    // width that's about to disappear when we set overflow:hidden.
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`
    }

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPaddingRight
    }
  }, [open, onClose])

  if (!open || !mounted) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hiw-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
    >
      <div
        className="absolute inset-0 bg-background/50 backdrop-blur-xs animate-[hiw-fade_160ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-foreground/15 bg-card shadow-xl animate-[hiw-in_200ms_ease-out]">
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 md:px-7 pt-5 md:pt-7 pb-3">
          <div>
            <h2 id="hiw-title" className="text-2xl md:text-3xl font-semibold tracking-tight">
              How{' '}
              <span className="italic font-serif text-primary">FileFork</span>{' '}
              works
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 md:px-7 pb-6 md:pb-7">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            FileFork shrinks your photos, videos, music, and PDFs so they&apos;re
            smaller and easier to share — and it does the whole thing inside
            your browser. Nothing you drop in ever leaves your computer.
          </p>

          <ol className="mt-6 space-y-5">
            <Step
              icon={ShieldCheck}
              index="01"
              title="Your files never leave your device"
              body="When you drop a file in, it stays on your computer. Nothing gets uploaded, nothing gets saved on our side. We don't even see what you're working with."
            />
            <Step
              icon={Cpu}
              index="02"
              title="The right tool for each file"
              body="Photos get the photo treatment, videos get the video treatment, and PDFs get tidied up too. You don't have to pick — FileFork figures it out."
            />
            <Step
              icon={Sliders}
              index="03"
              title="One click, or dial it in yourself"
              body={`Not sure what to pick? Hit "For the web" and you're done. Want to tweak things? Drag the quality slider, or open a single file to change just that one.`}
            />
            <Step
              icon={Scissors}
              index="04"
              title="Chop up long screenshots"
              body="Got a giant scrolling screenshot of a whole webpage? FileFork can slice it into neat pieces so it's easier to share or print. You pick how many slices, or let it decide."
            />
            <Step
              icon={Package}
              index="05"
              title="Drop a whole folder at once"
              body="Working with hundreds of files? Drop the whole folder. When it's done, you get one tidy ZIP back with everything inside. You can drop a ZIP in too — we'll open it for you."
            />
            <Step
              icon={Layers}
              index="06"
              title="Your settings stick around"
              body="Set things up the way you like once, and bookmark the page. Next time you open it, your preferred quality and format are already set."
            />
          </ol>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <InfoTile
              icon={Sparkles}
              label="Works without internet"
              body="Once the page loads, you can pull the plug on your Wi-Fi and FileFork keeps working."
            />
            <InfoTile
              icon={FileDown}
              label="Handles most file types"
              body="Photos, videos, music, and PDFs — all the everyday formats. If you can open it on your phone, FileFork can probably shrink it."
            />
          </div>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            <Github className="h-4 w-4" />
            See the code on GitHub
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes hiw-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hiw-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  )
}

function Step({
  icon: Icon,
  index,
  title,
  body,
}: {
  icon: typeof ShieldCheck
  index: string
  title: string
  body: string
}) {
  return (
    <li className="flex gap-4">
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/25 text-primary">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground/70">
          {index}
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="text-sm md:text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </li>
  )
}

function InfoTile({
  icon: Icon,
  label,
  body,
}: {
  icon: typeof Sparkles
  label: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
        <span className="text-xs font-semibold tracking-tight">{label}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  )
}
