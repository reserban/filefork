'use client'

import imageCompression from 'browser-image-compression'
import type { ImageFormat } from './types'

/**
 * HEIC/HEIF can't be decoded by canvas in Chromium/Firefox (and not reliably
 * in Safari). Detect and convert to JPEG via heic2any before handing off to
 * browser-image-compression.
 */
function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return (
    type === 'image/heic' || type === 'image/heif' ||
    name.endsWith('.heic') || name.endsWith('.heif')
  )
}

async function decodeHeic(file: File): Promise<File> {
  // Dynamic import keeps the libheif WASM out of the initial bundle —
  // only users who actually drop HEIC pay for it.
  try {
    const { heicTo } = await import('heic-to')
    const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 })
    const jpegName = file.name.replace(/\.(heic|heif)$/i, '.jpg')
    return new File([blob], jpegName, { type: 'image/jpeg' })
  } catch (err) {
    const detail =
      err instanceof Error ? err.message :
      typeof err === 'string' ? err :
      (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string')
        ? (err as { message: string }).message
        : 'unknown'
    throw new Error(`HEIC decode failed: ${detail}. Try exporting the photo to JPEG on your device and dropping that instead.`)
  }
}

const VERCEL_REQUEST_LIMIT = 4.5 * 1024 * 1024 // 4.5 MB - Vercel's serverless function limit

/** Files larger than this must be processed client-side to avoid Vercel's 4.5MB request limit */
export const CLIENT_PROCESSING_THRESHOLD = VERCEL_REQUEST_LIMIT

const FORMAT_TO_MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif', // browser-image-compression may not support - fallback to webp
  gif: 'image/gif',
}

export interface ClientImageOptimizeOptions {
  quality: number
  format: ImageFormat
  width?: number
  height?: number
}

export interface ClientImageOptimizeResult {
  success: boolean
  buffer?: ArrayBuffer
  optimizedSize?: number
  originalSize?: number
  reduction?: number
  width?: number
  height?: number
  /** Actual output format (may differ from requested if avif/gif fallback to webp) */
  format?: ImageFormat
  error?: string
}

/**
 * Optimize image client-side using browser-image-compression.
 * Use for files > 4.5MB to bypass Vercel's request body limit.
 */
export async function optimizeImageClient(
  file: File,
  options: ClientImageOptimizeOptions
): Promise<ClientImageOptimizeResult> {
  const originalSize = file.size

  try {
    // HEIC/HEIF isn't canvas-decodable in most browsers — convert to JPEG first.
    // Original size is preserved in the result so savings are reported correctly.
    const sourceFile = isHeic(file) ? await decodeHeic(file) : file

    // browser-image-compression supports jpeg, png, webp
    // For avif/gif, fall back to webp for best client-side support
    let targetFormat = options.format
    if (targetFormat === 'avif' || targetFormat === 'gif') {
      targetFormat = 'webp'
    }

    const fileType = FORMAT_TO_MIME[targetFormat] || 'image/webp'

    // Calculate maxWidthOrHeight from resolution
    let maxWidthOrHeight: number | undefined
    if (options.width || options.height) {
      maxWidthOrHeight = Math.max(options.width || 0, options.height || 0) || undefined
    }

    const initialQuality = options.quality / 100
    // maxSizeMB: allow output up to original size (compression controlled by initialQuality)
    const maxSizeMB = Math.max(1, originalSize / (1024 * 1024))

    const compressedFile = await imageCompression(sourceFile, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType,
      initialQuality,
      alwaysKeepResolution: !maxWidthOrHeight,
    })

    const optimizedSize = compressedFile.size
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100

    // Get dimensions from the compressed image
    let width = 0
    let height = 0
    try {
      const img = new Image()
      const url = URL.createObjectURL(compressedFile)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          width = img.naturalWidth
          height = img.naturalHeight
          URL.revokeObjectURL(url)
          resolve()
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image'))
        }
        img.src = url
      })
    } catch {
      width = options.width || 0
      height = options.height || 0
    }

    const buffer = await compressedFile.arrayBuffer()

    return {
      success: true,
      buffer,
      optimizedSize,
      originalSize,
      reduction,
      width,
      height,
      format: targetFormat,
    }
  } catch (error: unknown) {
    // Normalize any thrown shape to a readable message so users see the real
    // cause instead of a generic "compression failed" fallback.
    const message =
      error instanceof Error ? error.message :
      typeof error === 'string' ? error :
      (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string')
        ? (error as { message: string }).message
        : 'Client-side compression failed'
    console.error('Client image optimization error:', error)
    return {
      success: false,
      originalSize,
      error: message,
    }
  }
}
