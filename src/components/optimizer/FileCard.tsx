'use client'

import { memo, useEffect, useState } from 'react'
import {
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Music,
  Package,
  RotateCcw,
  Scissors,
  Settings2,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UploadedFile, OptimizedFile, Slice } from './types'
import { formatSize, formatDuration, estimateProcessingSeconds, formatSeconds } from './utils'
import { FileSettings } from './FileSettings'

export interface FileCardProps {
  fileData: UploadedFile
  isProcessing: boolean
  isSplitting: boolean
  isOptimizingSlices: boolean
  optimized: OptimizedFile | undefined
  splitSlices: Slice[] | undefined
  optimizedSplitSlices: Slice[] | undefined
  progress?: number            // 0–100, if the active pipeline reports progress
  startedAt?: number           // Date.now() when processing began
  onRemove: (id: string) => void
  onToggleSettings: (id: string) => void
  onUpdateFile: (id: string, updates: Partial<UploadedFile>) => void
  onReset: (id: string) => void
  onDownload: (optimized: OptimizedFile) => void
  onDownloadSplitZip: (fileData: UploadedFile, slices: Slice[]) => void
  onOptimize: (fileData: UploadedFile) => void
  onSplit: (fileData: UploadedFile) => void
  onOptimizeSlices: (fileData: UploadedFile, slices: Slice[]) => void
}

// Derive the "result" extension (what the optimized file will be named)
const outputExt = (fileData: UploadedFile): string => {
  if (fileData.type === 'pdf') return 'PDF'
  if (fileData.type === 'video') {
    if (fileData.format === 'gif') return 'GIF'
    return fileData.format.startsWith('webm') ? 'WEBM' : 'MP4'
  }
  if (fileData.type === 'audio') {
    return fileData.format === 'aac' ? 'M4A' : fileData.format.toUpperCase()
  }
  return fileData.format.toUpperCase()
}

export const FileCard = memo(function FileCard({
  fileData,
  isProcessing,
  isSplitting,
  isOptimizingSlices,
  optimized,
  splitSlices,
  optimizedSplitSlices,
  progress,
  startedAt,
  onRemove,
  onToggleSettings,
  onUpdateFile,
  onReset,
  onDownload,
  onDownloadSplitZip,
  onOptimize,
  onSplit,
  onOptimizeSlices,
}: FileCardProps) {
  const isPdf = fileData.type === 'pdf'
  const isAudio = fileData.type === 'audio'

  // State of this file (drives status indicator + right-side actions)
  const busy = isProcessing || isSplitting || isOptimizingSlices
  const done = !!optimized || !!optimizedSplitSlices
  const sliced = !!splitSlices
  const keptOriginal = !!optimized?.keptOriginal
  const outExt = outputExt(fileData)
  const canSplit = fileData.type === 'image' && ((fileData.originalHeight ?? 0) > 4000 || (fileData.originalWidth ?? 0) > 4000)

  // Pre-flight estimate (shown when idle + file is slow enough to warrant it)
  const estSeconds = !busy && !done && !sliced
    ? estimateProcessingSeconds(fileData.type, fileData.file.size, fileData.format, fileData.durationSec)
    : null

  // Live clock so elapsed/ETA update every second while busy. Reading Date.now()
  // in an effect (not in render) keeps the render pure; the interval re-ticks now.
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!busy) return
    // Seed immediately so the first render already has a real time, then tick at 1Hz.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [busy])

  // Elapsed + ETA while processing
  const elapsedSec = busy && startedAt && now ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0
  const etaSec = busy && progress != null && progress > 3 && elapsedSec > 1
    ? Math.max(0, Math.round(elapsedSec * (100 - progress) / progress))
    : null
  const hasActualProgress = busy && progress != null && progress > 0

  // Status pill copy
  const statusCopy = (() => {
    if (isSplitting) return 'Slicing…'
    if (isOptimizingSlices) return 'Compressing slices…'
    if (isProcessing) {
      if (progress != null && progress > 0) return `Compressing · ${progress}%`
      return 'Compressing…'
    }
    if (optimizedSplitSlices) return `${optimizedSplitSlices.length} slices ready`
    if (optimized && sliced) return `Done · ${splitSlices!.length} slices`
    if (optimized) return keptOriginal ? 'Already optimal' : 'Compressed'
    if (sliced) return `${splitSlices!.length} slices · ready`
    return null
  })()

  return (
    <div
      className={`group/file relative rounded-xl border bg-card transition-all overflow-hidden ${
        done ? 'border-primary/40' : sliced ? 'border-primary/40' : 'border-border'
      } ${busy ? 'ring-1 ring-primary/30' : ''}`}
    >

      <div className="p-3 md:p-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Preview thumbnail */}
          <div className="shrink-0">
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
              {isPdf ? (
                <FileText className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              ) : isAudio ? (
                <Music className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              ) : fileData.type === 'image' ? (
                <ImagePreview src={fileData.preview} />
              ) : (
                <Video className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              )}
              {fileData.durationSec && !fileData.type.includes('image') && (
                <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono bg-background/85 rounded px-1 leading-tight">
                  {formatDuration(fileData.durationSec)}
                </span>
              )}
            </div>
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-medium text-sm truncate">{fileData.file.name}</h3>
            </div>

            <div className="mt-1 text-xs text-muted-foreground min-h-[18px] relative">
              {/* Each state branch is keyed so React remounts it — the enter
                  animation then smooths the cross-fade between compositions. */}
              {busy ? (
                <div key="busy" className="flex items-center gap-2 flex-wrap min-w-0 animate-[fc-enter_240ms_ease-out]">
                  <span className="hidden sm:inline tabular-nums">{formatSize(fileData.file.size)}</span>
                  <span className="hidden sm:inline text-muted-foreground/50">·</span>
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {statusCopy}
                  </span>
                  {startedAt && elapsedSec >= 2 && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">·</span>
                      <span className="hidden sm:inline tabular-nums text-muted-foreground/70">
                        {formatSeconds(elapsedSec)} elapsed{etaSec != null ? ` · ~${formatSeconds(etaSec)} left` : ''}
                      </span>
                    </>
                  )}
                </div>
              ) : optimized && !keptOriginal ? (
                <div key="done" className="flex items-center gap-2 flex-wrap min-w-0 animate-[fc-enter_240ms_ease-out]">
                  <span className="hidden sm:inline tabular-nums line-through decoration-muted-foreground/40">
                    {formatSize(fileData.file.size)}
                  </span>
                  <span className="text-primary tabular-nums font-semibold">
                    {formatSize(optimized.optimizedSize)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/25 px-1.5 text-[10px] font-mono text-primary">
                    −{optimized.reduction.toFixed(0)}%
                  </span>
                  {statusCopy && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">·</span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-primary">
                        <Check className="h-3 w-3" />
                        {statusCopy}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div key="idle" className="flex items-center gap-2 flex-wrap min-w-0 animate-[fc-enter_240ms_ease-out]">
                  <span className="tabular-nums">{formatSize(fileData.file.size)}</span>
                  {fileData.originalWidth && fileData.originalHeight && fileData.type === 'image' && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="tabular-nums">{fileData.originalWidth}×{fileData.originalHeight}</span>
                    </>
                  )}
                  {estSeconds != null && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">·</span>
                      <span
                        className="hidden sm:inline tabular-nums text-muted-foreground/80"
                        title="Rough estimate — actual time depends on your hardware"
                      >
                        ~{formatSeconds(estSeconds)} to compress
                      </span>
                    </>
                  )}
                  {statusCopy && (
                    <>
                      <span className="text-muted-foreground/50">·</span>
                      <span
                        className={`inline-flex items-center gap-1 ${done || sliced ? 'text-primary' : ''}`}
                      >
                        {done ? (
                          <Check className="h-3 w-3" />
                        ) : sliced ? (
                          <Scissors className="h-3 w-3" />
                        ) : null}
                        {statusCopy}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side — settings toggle + actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!done && !sliced && (
              <button
                onClick={() => !busy && onToggleSettings(fileData.id)}
                disabled={busy}
                className={`group/set inline-flex items-center gap-1.5 h-8 rounded-md px-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed animate-[fc-enter_240ms_ease-out] ${
                  fileData.showSettings
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={`Per-file settings · ${fileData.quality}% · ${outExt}`}
              >
                <Settings2 className={`h-3.5 w-3.5 transition-transform ${fileData.showSettings ? 'rotate-90' : ''}`} />
                <span className="hidden sm:inline font-mono">{fileData.quality}%</span>
                <span className="hidden sm:inline text-muted-foreground/60 font-mono">{outExt}</span>
              </button>
            )}

            {/* State-dependent actions — labels collapse to icons on mobile.
                Keyed wrapper so each state-variant cluster enters with a fade. */}
            {optimizedSplitSlices ? (
              <div key="slices-done" className="flex items-center gap-1 animate-[fc-enter_240ms_ease-out]">
                <Button onClick={() => onReset(fileData.id)} variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" title="Undo">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button onClick={() => onDownloadSplitZip(fileData, optimizedSplitSlices)} size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:brightness-110" title="Download slices ZIP">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">ZIP</span>
                </Button>
              </div>
            ) : sliced ? (
              <div key="sliced" className="flex items-center gap-1 animate-[fc-enter_240ms_ease-out]">
                <Button onClick={() => onReset(fileData.id)} variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" title="Undo slice">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                {!optimized && (
                  <Button
                    onClick={() => onOptimizeSlices(fileData, splitSlices!)}
                    disabled={isOptimizingSlices || isSplitting}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5"
                    title="Compress slices"
                  >
                    {isOptimizingSlices ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Button onClick={() => onDownloadSplitZip(fileData, splitSlices!)} size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:brightness-110" title="Download slices ZIP">
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">ZIP</span>
                </Button>
              </div>
            ) : optimized ? (
              <div key="optimized" className="flex items-center gap-1 animate-[fc-enter_240ms_ease-out]">
                <Button onClick={() => onReset(fileData.id)} variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" title="Undo">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                {canSplit && (
                  <Button
                    onClick={() => onSplit(fileData)}
                    disabled={isSplitting}
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5"
                    title="Split into slices ≤ 4000px"
                  >
                    {isSplitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Button onClick={() => onDownload(optimized)} size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:brightness-110" title="Save compressed file">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            ) : (
              <div key="idle" className="flex items-center gap-1 animate-[fc-enter_240ms_ease-out]">
                {canSplit && (
                  <Button
                    onClick={() => onSplit(fileData)}
                    disabled={isSplitting || isProcessing}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5"
                    title="Split into slices ≤ 4000px — best for tall landing-page screenshots"
                  >
                    {isSplitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scissors className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Button
                  onClick={() => onOptimize(fileData)}
                  disabled={isProcessing || isSplitting}
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2.5 ${canSplit ? 'ml-1' : ''}`}
                  title="Compress file"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                </Button>
              </div>
            )}

            <button
              onClick={() => onRemove(fileData.id)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors opacity-60 group-hover/file:opacity-100"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Processing indicator.
          - Known progress → solid bar fills to `progress`% + shimmer sweep on top
          - Unknown progress → indeterminate gradient sweep, no snap, seamless loop
          The bar slides up from bottom on start and fades out on finish. */}
      {busy && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/10 overflow-hidden animate-[fc-bar-in_200ms_ease-out]">
          {hasActualProgress ? (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(2, progress!)}%` }}
              />
              {/* Highlight shimmer gliding across the filled portion */}
              <div
                className="absolute inset-y-0 left-0 animate-[fc-shimmer_1.6s_ease-in-out_infinite]"
                style={{
                  width: `${Math.max(2, progress!)}%`,
                  background:
                    'linear-gradient(90deg, transparent 0%, color-mix(in oklch, var(--primary-foreground) 45%, transparent) 50%, transparent 100%)',
                }}
              />
            </>
          ) : (
            /* Indeterminate: wide gradient sweeps edge-to-edge seamlessly */
            <div
              className="absolute inset-y-0 w-1/2 animate-[fc-sweep_1.4s_linear_infinite]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--primary) 35%, var(--primary) 65%, transparent 100%)',
              }}
            />
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes fc-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes fc-shimmer {
          0%   { transform: translateX(-100%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fc-enter {
          0%   { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fc-bar-in {
          0%   { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Per-file settings drawer */}
      {fileData.showSettings && !done && !sliced && (
        <FileSettings fileData={fileData} onUpdateFile={onUpdateFile} />
      )}
    </div>
  )
})

/**
 * Square thumbnail that gracefully degrades to an image icon when the browser
 * can't decode the source — e.g. HEIC in Chrome/Firefox, broken TIFF, etc.
 */
function ImagePreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) {
    return <ImageIcon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
  )
}
