'use client'

import {
  FileDown,
  Image as ImageIcon,
  Music,
  Package,
  Shield,
  Video,
} from 'lucide-react'

const CONVERSIONS: { icon: typeof ImageIcon; cat: string; from: string; to: string }[] = [
  { icon: ImageIcon, cat: 'IMAGE', from: 'HEIC', to: 'WebP' },
  { icon: Video,     cat: 'VIDEO', from: 'MOV',  to: 'MP4'  },
  { icon: Music,     cat: 'AUDIO', from: 'WAV',  to: 'Opus' },
  { icon: FileDown,  cat: 'DOC',   from: 'PDF',  to: 'PDF'  },
]

/**
 * Bento grid of feature cards — routing flow, conversion list,
 * batch/ZIP illustration, and privacy browser mock. All illustrations
 * are inline SVG with GPU-accelerated <animateMotion> travelling dots.
 */
export function Features() {
  return (
    <section className="py-10 md:py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl mb-6 md:mb-8">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Built around one idea:{' '}
            <span className="italic font-serif text-primary">your files, your machine</span>
          </h2>
          <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed">
            Everything below runs entirely in your browser. No server, no upload, no data trail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
          <DropRouteCard />
          <ConvertCard />
          <BatchZipCard />
          <PrivateBrowserCard />
        </div>
      </div>
    </section>
  )
}

/** Card 1 · wide · "Drop anything — we'll route it" */
function DropRouteCard() {
  return (
    <div className="md:col-span-3 flex flex-col md:min-h-[400px] rounded-2xl border border-foreground/15 bg-card overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
          Drop anything and we&apos;ll route it
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mt-1.5 leading-relaxed max-w-md">
          Images, video, audio or PDFs, mix them in a single drop. Each file takes the right pipeline automatically.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-2 pb-5 md:px-3 md:pb-6">
        {/* Mobile: vertical compact flow */}
        <svg
          viewBox="0 0 320 380"
          className="w-full h-auto max-h-[380px] sm:hidden"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <path id="mv-in-1" d="M 50 54 Q 100 100 160 170" fill="none" />
            <path id="mv-in-2" d="M 160 54 L 160 160" fill="none" />
            <path id="mv-in-3" d="M 270 54 Q 220 100 160 170" fill="none" />
            <path id="mv-out-1" d="M 160 210 Q 100 270 50 324" fill="none" />
            <path id="mv-out-2" d="M 160 220 L 160 324" fill="none" />
            <path id="mv-out-3" d="M 160 210 Q 220 270 270 324" fill="none" />
          </defs>

          <g stroke="currentColor" className="text-foreground/25" strokeWidth="1.5" strokeDasharray="6 8" fill="none">
            <use href="#mv-in-1" />
            <use href="#mv-in-2" />
            <use href="#mv-in-3" />
            <use href="#mv-out-1" />
            <use href="#mv-out-2" />
            <use href="#mv-out-3" />
          </g>

          {[
            { id: 'mv-in-1',  delay: '0s' },
            { id: 'mv-in-2',  delay: '0.7s' },
            { id: 'mv-in-3',  delay: '1.4s' },
            { id: 'mv-out-1', delay: '0.3s' },
            { id: 'mv-out-2', delay: '1.0s' },
            { id: 'mv-out-3', delay: '1.7s' },
          ].map(d => (
            <circle key={d.id} r="3.5" className="fill-primary">
              <animateMotion dur="3s" repeatCount="indefinite" begin={d.delay}>
                <mpath href={`#${d.id}`} />
              </animateMotion>
            </circle>
          ))}

          {/* Top row — inputs */}
          {[
            { x: 10,  l: 'HEIC', cat: 'IMAGE' },
            { x: 118, l: 'MP4',  cat: 'VIDEO' },
            { x: 230, l: 'WAV',  cat: 'AUDIO' },
          ].map(c => (
            <g key={`mv-in-${c.l}`} transform={`translate(${c.x} 26)`}>
              <rect width="82" height="40" rx="10" className="fill-card stroke-foreground/25" strokeWidth="1" />
              <text x="11" y="16" fontFamily="var(--font-sora)" fontSize="8" className="fill-muted-foreground" letterSpacing="1">
                {c.cat}
              </text>
              <text x="11" y="30" fontFamily="var(--font-sora)" fontSize="12" className="fill-foreground" fontWeight="600">
                {c.l}
              </text>
            </g>
          ))}

          {/* Center node */}
          <g>
            <circle cx="160" cy="190" r="40" className="fill-primary/15" opacity="0.6">
              <animate attributeName="r" values="40;52;40" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="190" r="32" className="fill-primary/25" />
            <circle cx="160" cy="190" r="24" className="fill-primary" />
            <g transform="translate(149.5 179.5) scale(0.5)" fill="var(--primary-foreground)">
              <path d="M11.8651 40.08C10.4403 41.3862 8.22601 41.29 6.91983 39.8652C5.61368 38.4403 5.70984 36.2261 7.13467 34.9199L19.1347 23.9199C20.4728 22.6933 22.527 22.6933 23.8651 23.9199L35.8651 34.9199C37.29 36.2261 37.3861 38.4403 36.08 39.8652C34.7738 41.29 32.5596 41.3862 31.1347 40.08L21.4999 31.249L11.8651 40.08Z" />
              <path d="M23.7372 17.1915C22.3989 18.3054 20.4309 18.2684 19.1347 17.0802L7.13468 6.08017C5.70984 4.77398 5.61369 2.55974 6.91983 1.13486C8.22602 -0.289975 10.4403 -0.386134 11.8651 0.920013L21.4999 9.75205L31.1347 0.920015C32.5596 -0.386132 34.7738 -0.289973 36.08 1.13486C37.3861 2.55975 37.29 4.77399 35.8651 6.08017L23.8651 17.0802L23.7372 17.1915Z" />
              <path d="M3.5 24C1.56701 24 0 22.433 0 20.5C0 18.567 1.56701 17 3.5 17L39.5 17C41.433 17 43 18.567 43 20.5C43 22.433 41.433 24 39.5 24L3.5 24Z" />
            </g>
          </g>

          {/* Bottom row — outputs */}
          {[
            { x: 10,  l: 'JPG',  cat: 'IMAGE' },
            { x: 118, l: 'WebM', cat: 'VIDEO' },
            { x: 230, l: 'Opus', cat: 'AUDIO' },
          ].map(c => (
            <g key={`mv-out-${c.l}`} transform={`translate(${c.x} 324)`}>
              <rect width="82" height="40" rx="10" className="fill-primary/10 stroke-primary/50" strokeWidth="1" />
              <text x="11" y="16" fontFamily="var(--font-sora)" fontSize="8" className="fill-primary/70" letterSpacing="1">
                {c.cat}
              </text>
              <text x="11" y="30" fontFamily="var(--font-sora)" fontSize="12" className="fill-primary" fontWeight="600">
                {c.l}
              </text>
            </g>
          ))}
        </svg>

        {/* Desktop: horizontal wide flow */}
        <svg
          viewBox="0 0 760 300"
          className="w-full h-auto max-h-[300px] hidden sm:block"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <path id="flow-in-1" d="M 150 50 Q 260 110 348 150" fill="none" />
            <path id="flow-in-2" d="M 150 150 L 348 150" fill="none" />
            <path id="flow-in-3" d="M 150 250 Q 260 190 348 150" fill="none" />
            <path id="flow-out-1" d="M 412 150 Q 510 110 610 50" fill="none" />
            <path id="flow-out-2" d="M 412 150 L 610 150" fill="none" />
            <path id="flow-out-3" d="M 412 150 Q 510 190 610 250" fill="none" />
          </defs>

          <g stroke="currentColor" className="text-foreground/25" strokeWidth="1.5" strokeDasharray="6 8" fill="none">
            <use href="#flow-in-1" />
            <use href="#flow-in-2" />
            <use href="#flow-in-3" />
            <use href="#flow-out-1" />
            <use href="#flow-out-2" />
            <use href="#flow-out-3" />
          </g>

          {[
            { id: 'flow-in-1',  delay: '0s'   },
            { id: 'flow-in-2',  delay: '0.7s' },
            { id: 'flow-in-3',  delay: '1.4s' },
            { id: 'flow-out-1', delay: '0.3s' },
            { id: 'flow-out-2', delay: '1.0s' },
            { id: 'flow-out-3', delay: '1.7s' },
          ].map(d => (
            <circle key={d.id} r="3.5" className="fill-primary">
              <animateMotion dur="3s" repeatCount="indefinite" begin={d.delay}>
                <mpath href={`#${d.id}`} />
              </animateMotion>
            </circle>
          ))}

          {[
            { y: 50,  l: 'HEIC', cat: 'IMAGE' },
            { y: 150, l: 'MP4',  cat: 'VIDEO' },
            { y: 250, l: 'WAV',  cat: 'AUDIO' },
          ].map(c => (
            <g key={`in-${c.l}`} transform={`translate(20 ${c.y - 22})`}>
              <rect width="130" height="44" rx="10" className="fill-card stroke-foreground/25" strokeWidth="1" />
              <text x="16" y="18" fontFamily="var(--font-sora)" fontSize="8" className="fill-muted-foreground" letterSpacing="1">
                {c.cat}
              </text>
              <text x="16" y="33" fontFamily="var(--font-sora), system-ui" fontSize="13" className="fill-foreground" fontWeight="600">
                {c.l}
              </text>
            </g>
          ))}

          {/* Center optimize node — uses the same glyph as /public/symbol.svg */}
          <g>
            <circle cx="380" cy="150" r="48" className="fill-primary/15" opacity="0.6">
              <animate attributeName="r" values="48;64;48" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="380" cy="150" r="40" className="fill-primary/25" />
            <circle cx="380" cy="150" r="32" className="fill-primary" />
            {/* Inline symbol.svg paths — viewBox 0 0 43 41, scaled 0.68 → ~29×28, centred on (380, 150) */}
            <g
              transform="translate(365.38 136.06) scale(0.68)"
              fill="var(--primary-foreground)"
            >
              <path d="M11.8651 40.08C10.4403 41.3862 8.22601 41.29 6.91983 39.8652C5.61368 38.4403 5.70984 36.2261 7.13467 34.9199L19.1347 23.9199C20.4728 22.6933 22.527 22.6933 23.8651 23.9199L35.8651 34.9199C37.29 36.2261 37.3861 38.4403 36.08 39.8652C34.7738 41.29 32.5596 41.3862 31.1347 40.08L21.4999 31.249L11.8651 40.08Z" />
              <path d="M23.7372 17.1915C22.3989 18.3054 20.4309 18.2684 19.1347 17.0802L7.13468 6.08017C5.70984 4.77398 5.61369 2.55974 6.91983 1.13486C8.22602 -0.289975 10.4403 -0.386134 11.8651 0.920013L21.4999 9.75205L31.1347 0.920015C32.5596 -0.386132 34.7738 -0.289973 36.08 1.13486C37.3861 2.55975 37.29 4.77399 35.8651 6.08017L23.8651 17.0802L23.7372 17.1915Z" />
              <path d="M3.5 24C1.56701 24 0 22.433 0 20.5C0 18.567 1.56701 17 3.5 17L39.5 17C41.433 17 43 18.567 43 20.5C43 22.433 41.433 24 39.5 24L3.5 24Z" />
            </g>
          </g>

          {[
            { y: 50,  l: 'JPG',  cat: 'IMAGE' },
            { y: 150, l: 'WebM', cat: 'VIDEO' },
            { y: 250, l: 'Opus', cat: 'AUDIO' },
          ].map(c => (
            <g key={`out-${c.l}`} transform={`translate(610 ${c.y - 22})`}>
              <rect width="130" height="44" rx="10" className="fill-primary/10 stroke-primary/50" strokeWidth="1" />
              <text x="16" y="18" fontFamily="var(--font-sora)" fontSize="8" className="fill-primary/70" letterSpacing="1">
                {c.cat}
              </text>
              <text x="16" y="33" fontFamily="var(--font-sora), system-ui" fontSize="13" className="fill-primary" fontWeight="600">
                {c.l}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

/** Card 2 · narrow · "Convert on the fly" — list of format conversions */
function ConvertCard() {
  return (
    <div className="md:col-span-2 flex flex-col md:min-h-[400px] rounded-2xl border border-foreground/15 bg-card overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">Convert on the fly</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Swap formats while you compress. One-click presets for web, archive, or max compatibility.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 md:px-5 pb-5 md:pb-6">
        <div className="rounded-xl border border-foreground/15 bg-background/40 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_1fr]">
            {CONVERSIONS.map((row, i) => {
              const RIcon = row.icon
              return (
                <div
                  key={row.cat}
                  className={`grid grid-cols-subgrid col-span-4 items-center gap-3 px-4 py-3 ${
                    i > 0 ? 'border-t border-foreground/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <RIcon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
                    <span className="text-[10px] font-mono tracking-[0.15em] text-muted-foreground/70">
                      {row.cat}
                    </span>
                  </div>
                  <span className="justify-self-center rounded-md bg-muted/60 px-3 py-1 font-mono text-xs text-foreground min-w-[60px] text-center">
                    {row.from}
                  </span>
                  <svg width="28" height="10" viewBox="0 0 28 10" fill="none" className="text-primary/70 shrink-0">
                    <path d="M0 5 H20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M18 2 L24 5 L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                  <span className="justify-self-center rounded-md border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs text-primary min-w-[60px] text-center">
                    {row.to}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground/70 px-1">
          Or pick any output format per file manually.
        </p>
      </div>
    </div>
  )
}

/** Card 3 · narrow · "Batch it, ZIP it" — stack of files → ZIP package */
function BatchZipCard() {
  return (
    <div className="md:col-span-2 flex flex-col rounded-2xl border border-foreground/15 bg-card overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">Batch it, slice it, ZIP it</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Drop a folder of 500 files, get one ZIP back. Tall screenshots get sliced into panels, no file is too big.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-3 pb-5 md:px-4 md:pb-6">
        <div className="flex items-center justify-between gap-3 w-full max-w-[320px]">
          <div className="relative h-28 w-24 shrink-0">
            {[
              { i: 0, label: 'IMG' },
              { i: 1, label: 'MP4' },
              { i: 2, label: 'WAV' },
            ].map(({ i, label }) => (
              <div
                key={i}
                className="absolute top-0 left-0 h-24 rounded-lg border border-foreground/25 bg-card flex flex-col p-2 shadow-sm"
                style={{
                  transform: `translate(${i * 8}px, ${i * 8}px)`,
                  zIndex: 3 - i,
                  width: '4.5rem',
                }}
              >
                <span className="h-0.5 w-5 rounded-full bg-foreground/15 mb-1" />
                <span className="h-0.5 w-10 rounded-full bg-foreground/10 mb-1" />
                <span className="h-0.5 w-7 rounded-full bg-foreground/10" />
                <span className="mt-auto text-[9px] font-mono font-semibold text-muted-foreground/70 tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <svg width="80" height="16" viewBox="0 0 80 16" fill="none" className="shrink-0">
            <path d="M0 8 H68" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className="text-foreground/35" />
            <path d="M64 3 L74 8 L64 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" className="text-foreground/45" />
          </svg>

          <div className="relative h-28 w-24 shrink-0 rounded-lg border border-primary/60 bg-primary/10 flex flex-col items-center justify-center py-3 shadow-sm">
            <Package className="h-10 w-10 text-primary" strokeWidth={1.75} />
            <span className="mt-1.5 rounded bg-primary px-2 py-0.5 text-[10px] font-mono font-semibold text-primary-foreground tracking-[0.15em]">
              .ZIP
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Card 4 · wide · "Nothing leaves your browser" — browser mock illustration */
function PrivateBrowserCard() {
  return (
    <div className="md:col-span-3 flex flex-col rounded-2xl border border-foreground/15 bg-card overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
          Nothing leaves your browser
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md">
          Client-side only. No server, no analytics. Zero network calls, works offline, open source.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-3 pb-5 md:px-4 md:pb-6">
        <div className="w-full rounded-xl border border-foreground/20 bg-background/60 flex flex-col overflow-hidden shadow-sm">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-foreground/15">
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/25" />
            <span className="h-2.5 w-2.5 rounded-full bg-foreground/25" />
            <div className="ml-2 flex-1 h-5 rounded bg-foreground/10 flex items-center px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
              <div className="h-0.5 flex-1 rounded bg-foreground/15" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-3 sm:gap-4 px-5 sm:px-6 py-5">
            <div className="col-span-2 sm:col-span-1 flex items-center gap-3">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 shrink-0">
                <Shield className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider">STATUS</span>
                <span className="text-sm font-medium">Private</span>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-center">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">RUNTIME</span>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-mono text-primary tracking-wider">LOCAL</span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider">UPLOADED</span>
              <span className="text-sm font-mono font-medium">0 B</span>
            </div>
          </div>

          <div className="border-t border-foreground/10 px-4 py-2.5 flex items-center justify-between gap-4 text-[10px] font-mono text-muted-foreground/70">
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              client-side
            </span>
            <svg height="8" viewBox="0 0 200 8" preserveAspectRatio="none" className="text-foreground/25 flex-1 h-2">
              <defs>
                <path id="browser-flow" d="M0 4 H192" fill="none" />
              </defs>
              <use href="#browser-flow" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              <circle r="1.8" className="fill-primary">
                <animateMotion dur="2.8s" repeatCount="indefinite">
                  <mpath href="#browser-flow" />
                </animateMotion>
              </circle>
            </svg>
            <span className="shrink-0">open source</span>
          </div>
        </div>
      </div>
    </div>
  )
}
