import Image from 'next/image'

interface BrandProps {
  /** Pixel width; height scales proportionally (native aspect ratio 5.65:1). */
  width?: number
  /** Whether to mark images as LCP priority (useful on header, not footer). */
  priority?: boolean
  /** Extra classes applied to both logo variants. */
  className?: string
}

/**
 * FileFork wordmark — renders the light variant in light mode and the dark
 * variant in dark mode using Tailwind's `dark:` visibility toggles (no FOUC).
 * The underlying SVG assets live in `public/logo-{light,dark}.svg`.
 */
export function Brand({ width = 113, priority = false, className }: BrandProps) {
  const height = Math.round(width / 5.65)
  return (
    <>
      <Image
        src="/logo-light.svg"
        alt="FileFork"
        width={width}
        height={height}
        priority={priority}
        className={`dark:hidden ${className ?? ''}`}
      />
      <Image
        src="/logo-dark.svg"
        alt="FileFork"
        width={width}
        height={height}
        priority={priority}
        className={`hidden dark:block ${className ?? ''}`}
      />
    </>
  )
}
