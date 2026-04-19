'use client'

import {
  ArrowRight,
  FolderOpen,
  Github,
  Package,
  Shield,
  Sparkle,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface HeroProps {
  /** Opens the OS file picker (provided by react-dropzone's `open`). */
  onChoose: () => void
  /** Optional error copy to render in an alert below the CTAs. */
  error?: string | null
}

const BENEFITS: { icon: typeof Shield; label: string; desc: string }[] = [
  {
    icon: Shield,
    label: 'Private by default',
    desc: 'Files never leave your browser. No account, no upload, no trace.',
  },
  {
    icon: Github,
    label: 'Open source',
    desc: 'Every line of code is inspectable. Fork it, audit it, self-host it.',
  },
  {
    icon: Package,
    label: 'Every format',
    desc: 'Images, video, audio and PDFs — compress or convert on the fly.',
  },
]

/**
 * Landing hero — full dashed frame with sparkle corner accents,
 * headline, CTAs, and a three-column benefits row below.
 * Rendered when no files are loaded.
 */
export function Hero({ onChoose, error }: HeroProps) {
  return (
    <section className="py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="relative rounded-2xl border border-dashed border-foreground/15">
          {/* Sparkles at all 4 outer corners */}
          <Sparkle className="absolute top-0 left-0 h-5 w-5 -translate-x-2.5 -translate-y-2.5 fill-primary text-primary" />
          <Sparkle className="absolute top-0 right-0 h-5 w-5 translate-x-2.5 -translate-y-2.5 fill-primary text-primary" />
          <Sparkle className="absolute bottom-0 left-0 h-5 w-5 -translate-x-2.5 translate-y-2.5 fill-primary text-primary" />
          <Sparkle className="absolute bottom-0 right-0 h-5 w-5 translate-x-2.5 translate-y-2.5 fill-primary text-primary" />

          {/* Row 1: hero text */}
          <div className="px-5 py-12 md:px-16 md:py-24">
            <div className="mx-auto max-w-3xl">
              <button
                onClick={onChoose}
                type="button"
                aria-label="Choose files — now with audio compression"
                className="group mx-auto mb-6 flex w-fit max-w-full items-center gap-2 rounded-full border border-foreground/15 bg-background/60 backdrop-blur pl-1 pr-3 py-1.5 text-[11px] sm:text-xs transition-all hover:border-primary/50 hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <span className="inline-flex ml-1 items-center rounded-full bg-primary text-primary-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                  New
                </span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  Now with audio compression
                </span>
                <ArrowRight className="inline h-3.5 w-3.5 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5" />
              </button>

              <h1 className="text-center text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter leading-[0.95]">
                Optimize{' '}
                <span className="italic font-serif text-primary">anything</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-center text-muted-foreground md:text-lg leading-relaxed">
                Images, videos, audio, PDFs - compressed and converted right in your browser.
                Nothing ever uploads.
              </p>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={onChoose}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110 active:brightness-95 active:scale-[0.98] transition-[filter,transform]"
                >
                  <FolderOpen className="h-4 w-4" strokeWidth={2.25} />
                  Choose files
                </button>
              </div>

              <p className="mt-3 text-center text-sm italic font-serif text-foreground/80">
                or drop anywhere
              </p>

              {error && (
                <div className="mt-8 max-w-xl mx-auto w-full">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: 3-column benefits */}
          <div className="grid border-t border-dashed border-foreground/15 md:grid-cols-3">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon
              const isMiddle = i === 1
              return (
                <div
                  key={b.label}
                  className={`relative p-6 md:p-8 lg:p-10 ${
                    isMiddle ? 'md:border-x md:border-dashed md:border-foreground/15' : ''
                  } ${i > 0 ? 'border-t border-dashed border-foreground/15 md:border-t-0' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="font-mono text-[11px] font-medium tracking-[0.15em] text-primary">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="h-px flex-1 bg-foreground/10" />
                    <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <p className="text-base md:text-lg font-medium tracking-tight">{b.label}</p>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
