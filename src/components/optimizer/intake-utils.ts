'use client'

import JSZip from 'jszip'
import { CONVERSION_PRESETS } from './constants'
import {
  defaultQualityForKind,
  detectFileKind,
  estimateOptimization,
  sameFormatOutput,
} from './utils'
import type { UploadedFile } from './types'
import type { UrlPrefs } from '@/hooks/use-url-prefs'

/** Read pixel dimensions from an image file using a detached `<img>`. */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ width: 0, height: 0 })
      return
    }
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}

/** Read duration of an audio/video File via a detached `<video>` element. */
export function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file)
      const el = document.createElement('video')
      el.preload = 'metadata'
      el.src = url
      const cleanup = () => URL.revokeObjectURL(url)
      el.onloadedmetadata = () => {
        const d = el.duration
        cleanup()
        resolve(isFinite(d) ? d : 0)
      }
      el.onerror = () => { cleanup(); resolve(0) }
    } catch {
      resolve(0)
    }
  })
}

/**
 * Extract files from a ZIP archive. Filters out directories, macOS metadata,
 * and unsupported file types. Errors are swallowed — callers check if the
 * returned list is empty.
 */
export async function extractFromZip(zipFile: File): Promise<File[]> {
  const extracted: File[] = []
  const zip = await JSZip.loadAsync(zipFile)
  const entries = Object.keys(zip.files).map(async (filename) => {
    const entry = zip.files[filename]
    if (entry.dir || filename.startsWith('__MACOSX') || filename.includes('/.')) return
    const blob = await entry.async('blob')
    const cleanName = filename.split('/').pop() || filename
    // ZIP entries surface as generic Blobs with no MIME. Attach one based on
    // the extension so downstream libraries (browser-image-compression in
    // particular) don't reject the File as "not an image".
    const type = mimeTypeForName(cleanName)
    const asFile = new File([blob], cleanName, type ? { type } : undefined)
    if (detectFileKind(asFile)) extracted.push(asFile)
  })
  await Promise.all(entries)
  return extracted
}

/** Map a filename extension to the MIME type our pipelines expect. */
function mimeTypeForName(name: string): string | undefined {
  const ext = (name.split('.').pop() ?? '').toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'jfif': return 'image/jpeg'
    case 'png':  return 'image/png'
    case 'gif':  return 'image/gif'
    case 'webp': return 'image/webp'
    case 'avif': return 'image/avif'
    case 'heic':
    case 'heif': return 'image/heic'
    case 'tif':
    case 'tiff': return 'image/tiff'
    case 'bmp':  return 'image/bmp'
    case 'svg':  return 'image/svg+xml'
    case 'ico':  return 'image/x-icon'
    case 'mp4':
    case 'm4v':  return 'video/mp4'
    case 'mov':  return 'video/quicktime'
    case 'webm': return 'video/webm'
    case 'avi':  return 'video/x-msvideo'
    case 'mkv':  return 'video/x-matroska'
    case '3gp':  return 'video/3gpp'
    case 'mp3':  return 'audio/mpeg'
    case 'wav':  return 'audio/wav'
    case 'aac':
    case 'm4a':  return 'audio/aac'
    case 'flac': return 'audio/flac'
    case 'ogg':  return 'audio/ogg'
    case 'opus': return 'audio/opus'
    case 'wma':  return 'audio/x-ms-wma'
    case 'aiff': return 'audio/aiff'
    case 'pdf':  return 'application/pdf'
    default:     return undefined
  }
}

/**
 * Build an UploadedFile from a raw File, applying URL-persisted sticky
 * preferences (preset, quality, per-type format overrides) on top of the
 * sensible defaults. This runs once per dropped file.
 */
export async function makeUploadedFile(file: File, urlPrefs: UrlPrefs): Promise<UploadedFile> {
  const kind = detectFileKind(file)! // caller must pre-filter
  const needsDimensions = kind === 'image'
  const dimensions = needsDimensions ? await getImageDimensions(file) : { width: 0, height: 0 }
  const duration = (kind === 'video' || kind === 'audio') ? await getMediaDuration(file) : 0
  const preview = kind === 'pdf' || kind === 'audio' ? '' : URL.createObjectURL(file)

  // Default to the "web" preset when no URL override is present so dropped
  // files get web-friendly formats out of the box. URL `?preset=keep` opts
  // out of conversion and keeps each file's original format.
  const presetFromUrl =
    urlPrefs.preset && ['web', 'keep'].includes(urlPrefs.preset)
      ? CONVERSION_PRESETS.find(p => p.id === urlPrefs.preset)
      : CONVERSION_PRESETS.find(p => p.id === 'web')
  const presetFormat =
    presetFromUrl && presetFromUrl.id !== 'keep'
      ? kind === 'image' ? presetFromUrl.image
        : kind === 'video' ? presetFromUrl.video
        : kind === 'audio' ? presetFromUrl.audio
        : undefined
      : undefined

  const formatFromUrl =
    kind === 'image' ? urlPrefs.image
    : kind === 'video' ? urlPrefs.video
    : kind === 'audio' ? urlPrefs.audio
    : undefined

  const initialQuality =
    typeof urlPrefs.quality === 'number'
      ? urlPrefs.quality
      : presetFromUrl?.quality ?? defaultQualityForKind(kind)

  const initialFormat = formatFromUrl || presetFormat || sameFormatOutput(file, kind)

  const initialSlices =
    kind === 'image' && urlPrefs.slices && urlPrefs.slices !== 'auto'
      ? parseInt(urlPrefs.slices, 10) || undefined
      : undefined

  const data: UploadedFile = {
    id: Math.random().toString(36).substring(2, 10),
    file,
    preview,
    type: kind,
    quality: initialQuality,
    format: initialFormat,
    resolution: 'original',
    showSettings: false,
    originalWidth: dimensions.width,
    originalHeight: dimensions.height,
    durationSec: duration || undefined,
    slices: initialSlices,
  }
  const est = estimateOptimization(
    file, data.type, data.quality, data.format, data.resolution,
    data.customWidth, data.customHeight, data.originalWidth, data.originalHeight,
  )
  return { ...data, estimatedSize: est.estimatedSize, estimatedReduction: est.estimatedReduction }
}
