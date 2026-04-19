'use client'

import { Upload } from 'lucide-react'
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone'
import { Brand } from '@/components/site/Brand'

interface DropOverlayProps {
  /** true when the dropzone root element is currently being dragged over */
  isDragActive: boolean
  /** true when ANY drag is in progress on the window (even outside the dropzone) */
  windowDragActive: boolean
  /** copy shown as the headline of the overlay ("Drop to optimize" vs "Drop to add more") */
  headline: string
  /** copy shown under the headline */
  subline?: string
  /** optional extra chip beneath the subline (e.g. "Images · Videos · Audio · PDFs") */
  chip?: React.ReactNode
  /** spread onto the fixed overlay div so drops are caught */
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T
  /** spread onto the hidden file input */
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T
}

/**
 * Fullscreen drop catcher. Sits behind everything (-z-10) when idle and
 * jumps to z-50 with a backdrop + dashed frame + centred glowing icon
 * the moment a file is dragged over the window. Drops anywhere on the
 * page trigger the wrapped onDrop handler.
 */
export function DropOverlay({
  isDragActive,
  windowDragActive,
  headline,
  subline = "Release anywhere, we'll figure out the rest",
  chip,
  getRootProps,
  getInputProps,
}: DropOverlayProps) {
  const active = isDragActive || windowDragActive

  return (
    <div
      {...getRootProps()}
      className={`fixed inset-0 transition-opacity duration-200 ${
        active ? 'z-50 pointer-events-auto opacity-100' : '-z-10 pointer-events-none opacity-0'
      }`}
    >
      <input {...getInputProps()} />
      {active && (
        <>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" aria-hidden />

          {/* Dashed frame */}
          <div
            className="absolute inset-4 md:inset-8 rounded-3xl border-2 border-dashed border-primary/70"
            aria-hidden
          />

          {/* Wordmark, pinned to the top of the frame */}
          <div className="absolute top-10 md:top-16 left-1/2 -translate-x-1/2">
            <Brand width={140} />
          </div>

          <div className="relative h-full flex items-center justify-center p-6 animate-[fc-drop-in_200ms_ease-out]">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-6">
                <span className="relative inline-flex items-center justify-center rounded-2xl bg-primary p-5 text-primary-foreground">
                  <Upload className="h-10 w-10" strokeWidth={2} />
                </span>
              </div>
              <p className="text-3xl md:text-5xl font-semibold tracking-tight">{headline}</p>
              <p className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto">
                {subline}
              </p>
              {chip && <div className="mt-6">{chip}</div>}
            </div>
          </div>

          <style jsx>{`
            @keyframes fc-drop-in {
              from { opacity: 0; transform: scale(0.96); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </>
      )}
    </div>
  )
}
