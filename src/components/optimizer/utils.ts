import { IMAGE_RESOLUTIONS, VIDEO_RESOLUTIONS } from './constants'
import type { FileKind } from './types'

export const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export const formatDuration = (sec: number) => {
  if (!isFinite(sec) || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Compression ratio ranges by output format
// min = lowest quality (max compression), max = highest quality (minimal compression)
const formatCompression: Record<string, { min: number; max: number }> = {
  // Images
  jpeg: { min: 0.3, max: 0.7 },
  png: { min: 0.5, max: 0.9 },
  webp: { min: 0.25, max: 0.6 },
  avif: { min: 0.2, max: 0.5 },
  gif: { min: 0.7, max: 0.95 },
  // Videos
  'mp4-h264': { min: 0.05, max: 0.7 },
  'mp4-h265': { min: 0.03, max: 0.6 },
  'webm-vp9': { min: 0.03, max: 0.55 },
  // PDFs
  pdf: { min: 0.4, max: 0.85 },
  // Audio (rough — real ratio depends on source bitrate)
  mp3: { min: 0.15, max: 0.85 },
  aac: { min: 0.12, max: 0.75 },
  opus: { min: 0.08, max: 0.6 },
  ogg: { min: 0.15, max: 0.8 },
  flac: { min: 0.6, max: 1.0 },
  wav: { min: 1.0, max: 1.5 },
}

export function estimateOptimization(
  file: File,
  type: FileKind,
  quality: number,
  format: string,
  resolution: string,
  customWidth?: number,
  customHeight?: number,
  originalWidth?: number,
  originalHeight?: number
): { estimatedSize: number; estimatedReduction: number } {
  const originalSize = file.size
  let estimatedSize = originalSize
  const qualityFactor = quality / 100

  const compression = formatCompression[format] || { min: 0.5, max: 0.8 }
  const ratio = compression.min + (compression.max - compression.min) * qualityFactor
  estimatedSize = originalSize * ratio

  if ((type === 'image' || type === 'video') && resolution !== 'original' && originalWidth && originalHeight) {
    let targetWidth = originalWidth
    let targetHeight = originalHeight

    if (resolution === 'custom' && customWidth && customHeight) {
      targetWidth = customWidth
      targetHeight = customHeight
    } else {
      const presets = type === 'image' ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS
      const preset = presets.find(r => r.value === resolution)
      if (preset && preset.width > 0) {
        targetWidth = preset.width
        targetHeight = preset.height
      }
    }

    const originalArea = originalWidth * originalHeight
    const targetArea = targetWidth * targetHeight
    const areaRatio = targetArea / originalArea
    const sizeRatio = type === 'image' ? areaRatio : Math.sqrt(areaRatio) * 0.7 + areaRatio * 0.3
    estimatedSize *= sizeRatio
  }

  if (estimatedSize > originalSize * 0.95 && format !== 'png' && format !== 'wav' && format !== 'flac') {
    estimatedSize = originalSize * 0.95
  }

  const reduction = ((originalSize - estimatedSize) / originalSize) * 100
  return {
    estimatedSize: Math.max(0, estimatedSize),
    estimatedReduction: Math.max(0, Math.min(100, reduction)),
  }
}

// Detect file kind from File
export function detectFileKind(file: File): FileKind | null {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'

  const imageExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic', '.heif', '.tiff', '.tif', '.bmp', '.svg', '.jfif', '.ico']
  const videoExt = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp']
  const audioExt = ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.opus', '.wma', '.aiff']

  if (imageExt.some(e => name.endsWith(e))) return 'image'
  if (videoExt.some(e => name.endsWith(e))) return 'video'
  if (audioExt.some(e => name.endsWith(e))) return 'audio'

  return null
}

export function defaultFormatForKind(kind: FileKind): string {
  switch (kind) {
    case 'image': return 'webp'
    case 'video': return 'mp4-h264'
    case 'audio': return 'mp3'
    case 'pdf': return 'pdf'
  }
}

/**
 * Best "same format" output for a given file — maps input extension to the
 * closest matching output the pipeline actually supports. HEIC / TIFF etc.
 * fall back to JPEG since those formats can't be re-encoded client-side.
 */
export function sameFormatOutput(file: File, kind: FileKind): string {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()

  if (kind === 'image') {
    switch (ext) {
      case 'jpg': case 'jpeg': case 'jfif': return 'jpeg'
      case 'png':  return 'png'
      case 'webp': return 'webp'
      case 'avif': return 'avif'
      case 'gif':  return 'gif'
      case 'bmp':  return 'png'            // BMP can't re-encode → preserve losslessly as PNG
      case 'tiff': case 'tif':
      case 'heic': case 'heif':
      case 'ico':  return 'jpeg'           // no direct output support → JPEG is the safe fallback
      case 'svg':  return 'webp'           // SVG raster fallback
      default:     return 'webp'
    }
  }
  if (kind === 'video') {
    switch (ext) {
      case 'mp4': case 'm4v': case 'mov':
      case 'avi': case 'mkv': case '3gp': return 'mp4-h264'
      case 'webm': return 'webm-vp9'
      default:     return 'mp4-h264'
    }
  }
  if (kind === 'audio') {
    switch (ext) {
      case 'mp3':  return 'mp3'
      case 'wav':  return 'wav'
      case 'flac': return 'flac'
      case 'aac': case 'm4a': return 'aac'
      case 'opus': return 'opus'
      case 'ogg':  return 'ogg'
      case 'aiff': case 'wma': return 'mp3'
      default:     return 'mp3'
    }
  }
  return 'pdf'
}

export function defaultQualityForKind(kind: FileKind): number {
  switch (kind) {
    case 'video': return 60
    default: return 80
  }
}

/**
 * Rough pre-flight time estimate for a file, in seconds.
 * Returns null for files that are always fast (small images, tiny audio, etc.)
 * Coefficients are empirical — FFmpeg WASM is roughly 0.5–2× real-time for video
 * depending on codec and hardware. These numbers lean conservative.
 */
export function estimateProcessingSeconds(
  type: FileKind,
  fileSize: number,
  videoFormat?: string,
  durationSec?: number
): number | null {
  const sizeMB = fileSize / (1024 * 1024)

  if (type === 'video') {
    // Prefer duration-based estimate if we have it; fall back to size.
    let base: number
    if (durationSec && durationSec > 0) {
      const multiplier =
        videoFormat === 'mp4-h265' ? 2.0 :
        videoFormat === 'webm-vp9' ? 2.5 : 1.2 // h264 default
      base = durationSec * multiplier
    } else {
      base = sizeMB * 1.5
    }
    return Math.max(3, Math.round(base))
  }

  if (type === 'audio') {
    if (sizeMB < 3) return null
    const multiplier = durationSec && durationSec > 0 ? durationSec * 0.08 : sizeMB * 0.3
    return Math.max(2, Math.round(multiplier))
  }

  if (type === 'pdf') {
    if (sizeMB < 5) return null
    return Math.round(sizeMB * 0.2)
  }

  // images: fast
  if (sizeMB < 15) return null
  return Math.round(sizeMB * 0.2)
}

export function formatSeconds(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (r === 0) return `${m} min`
  return `${m}m ${r}s`
}
