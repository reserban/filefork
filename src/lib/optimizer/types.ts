// Shared pipeline types used by both the server-side sharp route and the
// client-side image optimizer. Per-codec options for video and audio live
// next to each pipeline (client-video-optimizer.ts / client-audio-optimizer.ts).

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif'

export interface ImageOptimizationOptions {
  quality: number // 0-100
  format: ImageFormat
  width?: number
  height?: number
  maintainAspectRatio?: boolean
}

export interface OptimizationResult {
  success: boolean
  originalSize: number // in bytes
  optimizedSize: number // in bytes
  reduction: number // percentage (0-100)
  width: number
  height: number
  format: string
  error?: string
}
