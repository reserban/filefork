'use client'

import { optimizeVideoClient, loadFFmpeg } from '@/lib/optimizer/client-video-optimizer'
import { optimizeImageClient } from '@/lib/optimizer/client-image-optimizer'
import { optimizeAudioClient, extensionForAudioFormat, type AudioFormat } from '@/lib/optimizer/client-audio-optimizer'
import { IMAGE_RESOLUTIONS, VIDEO_RESOLUTIONS } from './constants'
import type { UploadedFile } from './types'

export interface OptimizationOutput {
  buffer: ArrayBuffer
  originalSize: number
  optimizedSize: number
  reduction: number
  width: number
  height: number
  /** Actual output format — distinguishes AVIF→WebP fallback for images, and audio container for `.m4a` etc. */
  outputFormat?: string
}

export interface OptimizationContext {
  /** `false` if FFmpeg failed to load previously; callers skip video files in that state. */
  videoProcessingAvailable: boolean | null
  /** Per-file progress callback (0–100). */
  onProgress?: (pct: number) => void
  /** Called when FFmpeg load fails mid-run so callers can update their availability flag. */
  onVideoUnavailable?: () => void
}

/**
 * Run the correct pipeline for a single file. Pure orchestration: no state
 * setters, no error reporting — throws on failure, returns the optimization
 * output otherwise. Callers handle state, error UI, and the "keep original
 * if it got bigger" decision.
 */
export async function runOptimization(
  fileData: UploadedFile,
  ctx: OptimizationContext,
): Promise<OptimizationOutput> {
  if (fileData.type === 'video') {
    if (ctx.videoProcessingAvailable === false) {
      throw new Error('Video optimization is not available in this browser. Please use a modern browser like Chrome or Firefox.')
    }

    const { targetWidth, targetHeight } = resolveDimensions(fileData, VIDEO_RESOLUTIONS)

    try {
      await loadFFmpeg()
    } catch {
      ctx.onVideoUnavailable?.()
      throw new Error('Failed to initialize video processor. Please try refreshing the page.')
    }

    const result = await optimizeVideoClient(
      fileData.file,
      {
        quality: fileData.quality,
        format: fileData.format as 'mp4-h264' | 'mp4-h265' | 'webm-vp9',
        width: targetWidth,
        height: targetHeight,
      },
      ctx.onProgress,
    )
    if (!result.success) throw new Error(result.error || 'Video optimization failed')

    return {
      buffer: result.buffer,
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      reduction: result.reduction,
      width: result.width || fileData.originalWidth || 0,
      height: result.height || fileData.originalHeight || 0,
    }
  }

  if (fileData.type === 'pdf') {
    const { optimizePdfClient } = await import('@/lib/optimizer/client-pdf-optimizer')
    const result = await optimizePdfClient(fileData.file, { quality: fileData.quality, stripMetadata: true })
    const originalSize = fileData.file.size
    const optimizedSize = result.buffer.byteLength
    return {
      buffer: result.buffer,
      originalSize,
      optimizedSize,
      reduction: originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 100) : 0,
      width: 0,
      height: 0,
    }
  }

  if (fileData.type === 'audio') {
    try {
      await loadFFmpeg()
    } catch {
      throw new Error('Audio processing needs FFmpeg. Please try a modern browser (Chrome, Firefox, Edge, Safari 16+).')
    }
    const result = await optimizeAudioClient(
      fileData.file,
      { quality: fileData.quality, format: fileData.format as AudioFormat },
      ctx.onProgress,
    )
    if (!result.success) throw new Error(result.error || 'Audio optimization failed')

    return {
      buffer: result.buffer,
      originalSize: result.originalSize,
      optimizedSize: result.optimizedSize,
      reduction: result.reduction,
      width: 0,
      height: 0,
      outputFormat: extensionForAudioFormat(result.format),
    }
  }

  // Images — fully client-side so no file ever leaves the browser.
  const { targetWidth, targetHeight } = resolveDimensions(fileData, IMAGE_RESOLUTIONS)
  const result = await optimizeImageClient(fileData.file, {
    quality: fileData.quality,
    format: fileData.format as 'jpeg' | 'png' | 'webp' | 'avif' | 'gif',
    width: targetWidth,
    height: targetHeight,
  })
  if (!result.success || !result.buffer) throw new Error(result.error || 'Image optimization failed')

  return {
    buffer: result.buffer,
    originalSize: result.originalSize!,
    optimizedSize: result.optimizedSize!,
    reduction: result.reduction!,
    width: result.width || fileData.originalWidth || 0,
    height: result.height || fileData.originalHeight || 0,
    outputFormat: result.format,
  }
}

/** Resolve requested width/height from a resolution key against a preset table. */
function resolveDimensions(
  fileData: UploadedFile,
  presets: { value: string; width: number; height: number }[],
): { targetWidth: number | undefined; targetHeight: number | undefined } {
  if (fileData.resolution === 'original') return { targetWidth: undefined, targetHeight: undefined }
  const preset = presets.find((r) => r.value === fileData.resolution)
  if (preset?.value === 'custom') return { targetWidth: fileData.customWidth, targetHeight: fileData.customHeight }
  if (preset && preset.width > 0) return { targetWidth: preset.width, targetHeight: preset.height }
  return { targetWidth: undefined, targetHeight: undefined }
}
