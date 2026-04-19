'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null
let ffmpegLoading = false
let ffmpegLoaded = false
let loadError: string | null = null

/**
 * Load FFmpeg.wasm (only once)
 */
export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegLoaded && ffmpeg) {
    return ffmpeg
  }

  if (loadError) {
    throw new Error(loadError)
  }

  if (ffmpegLoading) {
    // Wait for existing load to complete
    while (ffmpegLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (ffmpeg && ffmpegLoaded) {
      return ffmpeg
    }
    if (loadError) {
      throw new Error(loadError)
    }
  }

  ffmpegLoading = true

  try {
    ffmpeg = new FFmpeg()

    // Try loading with explicit CDN URLs
    // Using jsdelivr which has good CORS support
    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd'

    // Fetch files and convert to blob URLs for better compatibility
    const coreResponse = await fetch(`${baseURL}/ffmpeg-core.js`)
    const wasmResponse = await fetch(`${baseURL}/ffmpeg-core.wasm`)
    
    if (!coreResponse.ok || !wasmResponse.ok) {
      throw new Error('Failed to fetch FFmpeg files from CDN')
    }
    
    const coreBlob = await coreResponse.blob()
    const wasmBlob = await wasmResponse.blob()
    
    const coreURL = URL.createObjectURL(new Blob([coreBlob], { type: 'text/javascript' }))
    const wasmURL = URL.createObjectURL(new Blob([wasmBlob], { type: 'application/wasm' }))

    await ffmpeg.load({
      coreURL,
      wasmURL,
    })

    ffmpegLoaded = true
    return ffmpeg
  } catch (error) {
    console.error('Failed to load FFmpeg.wasm:', error)
    loadError = 'Video processing is not available. Your browser may not support WebAssembly or there was a network error.'
    ffmpegLoading = false
    ffmpeg = null
    throw new Error(loadError)
  } finally {
    ffmpegLoading = false
  }
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
  return ffmpegLoaded
}

interface VideoOptimizeOptions {
  quality: number // 0-100
  format: 'mp4-h264' | 'mp4-h265' | 'webm-vp9'
  width?: number
  height?: number
}

interface VideoOptimizeResult {
  success: boolean
  buffer: ArrayBuffer
  originalSize: number
  optimizedSize: number
  reduction: number
  width: number
  height: number
  error?: string
}

/**
 * Convert quality (0-100) to CRF value
 * Lower quality = higher CRF = more compression = smaller files
 */
function qualityToCRF(quality: number, codec: string): number {
  const normalized = Math.max(0, Math.min(100, quality))

  switch (codec) {
    case 'libx264':
      // H.264: CRF range 18-51 (51 is max compression)
      // quality 100 = CRF 18 (high quality)
      // quality 0 = CRF 51 (extreme compression)
      return Math.round(51 - (normalized / 100) * 33)
    case 'libx265':
      // H.265: CRF range 18-51 (more efficient than H.264)
      // quality 100 = CRF 18
      // quality 0 = CRF 51
      return Math.round(51 - (normalized / 100) * 33)
    case 'libvpx-vp9':
      // VP9: CRF range 15-63 (63 is max compression)
      // quality 100 = CRF 15
      // quality 0 = CRF 63
      return Math.round(63 - (normalized / 100) * 48)
    default:
      return 28
  }
}

/**
 * Get preset based on quality (lower quality = faster preset = smaller files)
 */
function getPreset(quality: number, codec: string): string {
  if (codec === 'libvpx-vp9') {
    // VP9 uses cpu-used instead of preset
    return ''
  }
  
  // For H.264/H.265: lower quality allows faster presets which produce smaller files
  if (quality <= 20) return 'veryfast'
  if (quality <= 40) return 'faster'
  if (quality <= 60) return 'fast'
  if (quality <= 80) return 'medium'
  return 'slow' // Higher quality, slower encoding
}

/**
 * Get audio bitrate based on quality
 */
function getAudioBitrate(quality: number): string {
  if (quality <= 20) return '64k'
  if (quality <= 40) return '96k'
  if (quality <= 60) return '128k'
  if (quality <= 80) return '160k'
  return '192k'
}

/**
 * Optimize video using FFmpeg.wasm (client-side)
 */
export async function optimizeVideoClient(
  file: File,
  options: VideoOptimizeOptions,
  onProgress?: (progress: number) => void
): Promise<VideoOptimizeResult> {
  const originalSize = file.size

  let active = true
  const progressHandler = ({ progress }: { progress: number }) => {
    if (!active) return
    onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))))
  }

  try {
    const ff = await loadFFmpeg()

    // Attach per-call progress listener (FFmpeg is a singleton; guard flag
    // prevents stale calls from bleeding progress into later files)
    if (onProgress) {
      ff.on('progress', progressHandler)
    }

    // Determine codec and output format
    let codec = 'libx264'
    let outputExt = 'mp4'
    let outputFormat = 'mp4'

    if (options.format === 'mp4-h265') {
      codec = 'libx265'
    } else if (options.format === 'webm-vp9') {
      codec = 'libvpx-vp9'
      outputExt = 'webm'
      outputFormat = 'webm'
    }

    const crf = qualityToCRF(options.quality, codec)
    const inputFileName = `input_${Date.now()}.${file.name.split('.').pop() || 'mp4'}`
    const outputFileName = `output_${Date.now()}.${outputExt}`

    // Write input file to FFmpeg virtual filesystem
    await ff.writeFile(inputFileName, await fetchFile(file))

    // Build FFmpeg arguments
    const args: string[] = ['-i', inputFileName]

    // Add codec
    args.push('-c:v', codec)

    // Add CRF for quality
    args.push('-crf', crf.toString())

    // Get dynamic preset and audio bitrate based on quality
    const preset = getPreset(options.quality, codec)
    const audioBitrate = getAudioBitrate(options.quality)

    // Codec-specific options
    if (codec === 'libx264') {
      args.push('-preset', preset)
      args.push('-movflags', '+faststart')
      args.push('-c:a', 'aac')
      args.push('-b:a', audioBitrate)
      // For very low quality, also reduce frame rate
      if (options.quality <= 30) {
        args.push('-r', '24') // Reduce to 24fps
      }
    } else if (codec === 'libx265') {
      args.push('-preset', preset)
      args.push('-movflags', '+faststart')
      args.push('-tag:v', 'hvc1')
      args.push('-c:a', 'aac')
      args.push('-b:a', audioBitrate)
      // For very low quality, also reduce frame rate
      if (options.quality <= 30) {
        args.push('-r', '24')
      }
    } else if (codec === 'libvpx-vp9') {
      args.push('-b:v', '0')
      args.push('-deadline', 'good')
      // cpu-used: 0-5, higher = faster/lower quality
      const cpuUsed = options.quality <= 30 ? 4 : options.quality <= 60 ? 3 : 2
      args.push('-cpu-used', cpuUsed.toString())
      args.push('-c:a', 'libopus')
      args.push('-b:a', audioBitrate)
      // For very low quality, also reduce frame rate
      if (options.quality <= 30) {
        args.push('-r', '24')
      }
    }

    // Add resolution scaling if specified
    if (options.width || options.height) {
      let scale = ''
      if (options.width && options.height) {
        scale = `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2`
      } else if (options.width) {
        scale = `scale=${options.width}:-2`
      } else if (options.height) {
        scale = `scale=-2:${options.height}`
      }
      if (scale) {
        args.push('-vf', scale)
      }
    }

    // Output format
    args.push('-f', outputFormat)
    args.push(outputFileName)

    // Run FFmpeg
    await ff.exec(args)

    // Read output file
    const data = await ff.readFile(outputFileName)
    const uint8Array = data as Uint8Array
    
    // Create a proper ArrayBuffer by copying the data
    const outputBuffer = new ArrayBuffer(uint8Array.length)
    new Uint8Array(outputBuffer).set(uint8Array)

    // Clean up
    await ff.deleteFile(inputFileName)
    await ff.deleteFile(outputFileName)

    const optimizedSize = outputBuffer.byteLength
    const reduction = ((originalSize - optimizedSize) / originalSize) * 100

    active = false
    onProgress?.(100)
    return {
      success: true,
      buffer: outputBuffer,
      originalSize,
      optimizedSize,
      reduction: Math.max(0, reduction),
      width: options.width || 0,
      height: options.height || 0,
    }
  } catch (error) {
    active = false
    console.error('Client video optimization error:', error)
    return {
      success: false,
      buffer: await file.arrayBuffer(),
      originalSize,
      optimizedSize: originalSize,
      reduction: 0,
      width: 0,
      height: 0,
      error: error instanceof Error ? error.message : 'Failed to optimize video',
    }
  }
}
