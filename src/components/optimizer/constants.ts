import {
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Package,
  Globe,
  Feather,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// FileKind lives in ./types — re-exported here for ergonomics since most
// consumers of constants also need the kind union.
export type { FileKind } from './types'

export const IMAGE_FORMATS = [
  { value: 'jpeg', label: 'JPEG', description: 'Best for photos, smaller files' },
  { value: 'png', label: 'PNG', description: 'Lossless, supports transparency' },
  { value: 'webp', label: 'WebP', description: 'Modern format, great compression' },
  { value: 'avif', label: 'AVIF', description: 'Next-gen, best compression' },
  { value: 'gif', label: 'GIF', description: 'For animations' },
]

export const VIDEO_FORMATS = [
  { value: 'mp4-h264', label: 'MP4 (H.264)', description: 'Most compatible' },
  { value: 'mp4-h265', label: 'MP4 (H.265)', description: 'Better compression, newer' },
  { value: 'webm-vp9', label: 'WebM (VP9)', description: 'Web-optimized' },
]

export const AUDIO_FORMATS = [
  { value: 'mp3', label: 'MP3', description: 'Universal compatibility' },
  { value: 'aac', label: 'AAC (M4A)', description: 'Best for streaming' },
  { value: 'opus', label: 'Opus', description: 'Best compression, modern' },
  { value: 'ogg', label: 'OGG (Vorbis)', description: 'Open-source favorite' },
  { value: 'flac', label: 'FLAC', description: 'Lossless archive' },
  { value: 'wav', label: 'WAV', description: 'Uncompressed PCM' },
]

// Resolution presets
export const IMAGE_RESOLUTIONS = [
  { value: 'original', label: 'Original Size', width: 0, height: 0 },
  { value: 'fhd', label: '1920x1080 (Full HD)', width: 1920, height: 1080 },
  { value: 'hd', label: '1280x720 (HD)', width: 1280, height: 720 },
  { value: 'sd', label: '640x480 (SD)', width: 640, height: 480 },
  { value: 'custom', label: 'Custom Size', width: -1, height: -1 },
]

export const VIDEO_RESOLUTIONS = [
  { value: 'original', label: 'Original Size', width: 0, height: 0 },
  { value: '1080p', label: '1920x1080 (1080p)', width: 1920, height: 1080 },
  { value: '720p', label: '1280x720 (720p)', width: 1280, height: 720 },
  { value: '480p', label: '854x480 (480p)', width: 854, height: 480 },
  { value: 'custom', label: 'Custom Size', width: -1, height: -1 },
]

// Accept mode — drives which file types the dropzone accepts
export type AcceptMode = 'all' | 'image' | 'video' | 'audio' | 'pdf'

export const ACCEPT_MODES: {
  value: AcceptMode
  label: string
  icon: LucideIcon
  hint: string
}[] = [
  { value: 'all', label: 'All files', icon: Package, hint: 'Drop anything — we figure it out' },
  { value: 'image', label: 'Images', icon: ImageIcon, hint: 'JPG · PNG · WebP · AVIF · GIF · HEIC · TIFF · BMP · SVG' },
  { value: 'video', label: 'Videos', icon: Video, hint: 'MP4 · MOV · WebM · AVI · MKV' },
  { value: 'audio', label: 'Audio', icon: Music, hint: 'MP3 · WAV · AAC · FLAC · OGG · M4A · Opus' },
  { value: 'pdf', label: 'PDFs', icon: FileText, hint: 'Compressed inline, metadata stripped' },
]

// Conversion presets — one-click targets for batch format conversion
export interface ConversionPreset {
  id: string
  label: string
  description: string
  icon: LucideIcon
  image?: string | null   // null = don't touch, string = force this format
  video?: string | null
  audio?: string | null
  quality?: number
}

export const CONVERSION_PRESETS: ConversionPreset[] = [
  {
    id: 'web',
    label: 'For the web',
    description: 'WebP · MP4 (H.264) · MP3 — fast, universal, great for websites',
    icon: Globe,
    image: 'webp',
    video: 'mp4-h264',
    audio: 'mp3',
    quality: 80,
  },
  {
    id: 'keep',
    label: 'Same format',
    description: 'Just compress — keep every file in its original format',
    icon: Feather,
    image: null,
    video: null,
    audio: null,
  },
]
