export type Slice = { name: string; buffer: ArrayBuffer }

export type FileKind = 'image' | 'video' | 'audio' | 'pdf'

/** Active dropdown filter in the file list header — "all" or one kind. */
export type FileFilter = 'all' | FileKind

export interface UploadedFile {
  id: string
  file: File
  preview: string
  type: FileKind
  quality: number
  format: string
  resolution: string
  customWidth?: number
  customHeight?: number
  showSettings: boolean
  estimatedReduction?: number
  estimatedSize?: number
  originalWidth?: number
  originalHeight?: number
  slices?: number // undefined = auto (based on MAX_SLICE_PX)
  pageCount?: number // PDF only
  durationSec?: number // audio/video only
}

export interface OptimizedFile {
  id: string
  name: string
  buffer: ArrayBuffer
  originalSize: number
  optimizedSize: number
  reduction: number
  width: number
  height: number
  keptOriginal?: boolean
}
