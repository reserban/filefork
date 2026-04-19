import Image from 'next/image'
import { Brand } from './Brand'

const GITHUB_URL = 'https://github.com/reserban/filefork'
const CONTACT_EMAIL = 'filefork@unzet.com'
const UNZET_URL = 'https://www.unzet.com/'
const MIT_URL = 'https://opensource.org/licenses/MIT'

/**
 * Full site footer. Two-column top section (brand + Unzet attribution card),
 * dashed divider, mono small-caps bottom bar. Drop-in for any page.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-14">
      <div className="max-w-6xl mx-auto px-6 pt-8 md:pt-12 pb-4">
        <div className="grid gap-8 md:gap-12 md:grid-cols-[1.7fr_1fr]">
          <BrandBlock />
          <UnzetCard />
        </div>

        <div className="mt-8 pt-4 border-t border-dashed border-foreground/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono tracking-[0.12em] uppercase text-muted-foreground/70">
          <span>© {new Date().getFullYear()} FileFork</span>
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Files stay on your device
          </span>
          <span>MIT · open source</span>
        </div>
      </div>
    </footer>
  )
}

/** Left column: wordmark, one-paragraph pitch, flat nav row. */
function BrandBlock() {
  return (
    <div className="space-y-5">
      <div>
        <Brand width={124} />
      </div>

      <p className="text-base text-muted-foreground leading-relaxed max-w-md">
        Compress and convert images, videos, audio and PDFs, entirely in your browser.
        No uploads, no accounts, open source.
      </p>

      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <FooterLink href={GITHUB_URL}>GitHub</FooterLink>
        <FooterLink href={MIT_URL}>MIT license</FooterLink>
        <FooterLink href={`mailto:${CONTACT_EMAIL}`} external={false}>
          Contact
        </FooterLink>
      </nav>
    </div>
  )
}

/** Right column: the Unzet attribution card (the whole card is one link). */
function UnzetCard() {
  return (
    <a
      href={UNZET_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Unzet — Build before it's obvious"
      className="group block rounded-xl border border-border bg-muted/30 p-5 transition-colors hover:border-foreground/30 hover:bg-muted/50"
    >
      <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-3">
        Part of the mission
      </span>

      <Image
        src="/unzet-logo-white.svg"
        alt="Unzet"
        width={100}
        height={20}
        className="invert dark:invert-0 transition-opacity group-hover:opacity-80 mb-3"
      />

      <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
        FileFork is open source and shipped fast, the kind of Europe Unzet wants more of.
      </p>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
        <span className="underline underline-offset-4 decoration-primary/30 group-hover:decoration-primary transition-colors">
          unzet.com
        </span>
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </a>
  )
}

function FooterLink({
  href,
  children,
  external = true,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="text-foreground/70 hover:text-foreground transition-colors"
    >
      {children}
    </a>
  )
}
