'use client'

import { fetchFile } from '@ffmpeg/util'
import { loadFFmpeg } from './client-video-optimizer'

export type AudioFormat = 'mp3' | 'aac' | 'opus' | 'ogg' | 'flac' | 'wav'

interface AudioOptimizeOptions {
  quality: number // 0-100
  format: AudioFormat
}

interface AudioOptimizeResult {
  success: boolean
  buffer: ArrayBuffer
  originalSize: number
  optimizedSize: number
  reduction: number
  format: AudioFormat
  error?: string
}

// Map quality 0-100 → bitrate string FFmpeg understands
function qualityToBitrate(quality: number, format: AudioFormat): string {
  const q = Math.max(0, Math.min(100, quality))
  switch (format) {
    case 'opus':
      // Opus shines at low bitrates: 24–160k covers everything
      return Math.round(24 + (q / 100) * 136) + 'k'
    case 'aac':
      // AAC is more efficient than MP3 — 48k floor, 192k ceiling is plenty.
      return Math.round(48 + (q / 100) * 144) + 'k'
    case 'mp3':
      // MP3 uses VBR via -q:a (see buildArgs); not a CBR bitrate.
      return '0'
    case 'ogg':
      // Vorbis 64–256k
      return Math.round(64 + (q / 100) * 192) + 'k'
    case 'flac':
    case 'wav':
      // Lossless — ignored
      return '0'
  }
}

// MP3 VBR quality: libmp3lame -q:a accepts 0 (best, ~245k) → 9 (worst, ~65k).
// Our 0–100 slider maps inversely: higher slider = lower -q:a number = better.
function mp3VbrQuality(quality: number): string {
  const q = Math.max(0, Math.min(100, quality))
  return String(Math.round(9 - (q / 100) * 9))
}

export async function optimizeAudioClient(
  file: File,
  options: AudioOptimizeOptions,
  onProgress?: (progress: number) => void
): Promise<AudioOptimizeResult> {
  const originalSize = file.size
  let active = true
  const progressHandler = ({ progress }: { progress: number }) => {
    if (!active) return
    onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))))
  }
  try {
    const ff = await loadFFmpeg()
    if (onProgress) ff.on('progress', progressHandler)

    const inputExt = file.name.split('.').pop()?.toLowerCase() || 'audio'
    const inputName = `in_${Date.now()}.${inputExt}`
    const output = buildOutputName(options.format)
    await ff.writeFile(inputName, await fetchFile(file))

    const args = buildArgs(inputName, output.name, options)
    await ff.exec(args)

    const data = await ff.readFile(output.name)
    const bytes = data as Uint8Array
    const out = new ArrayBuffer(bytes.length)
    new Uint8Array(out).set(bytes)

    await ff.deleteFile(inputName).catch(() => {})
    await ff.deleteFile(output.name).catch(() => {})

    const optimizedSize = out.byteLength
    const reduction = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize) * 100 : 0

    active = false
    onProgress?.(100)
    return {
      success: true,
      buffer: out,
      originalSize,
      optimizedSize,
      reduction: Math.max(0, reduction),
      format: options.format,
    }
  } catch (err) {
    active = false
    const message = err instanceof Error ? err.message : 'Failed to optimize audio'
    return {
      success: false,
      buffer: await file.arrayBuffer(),
      originalSize,
      optimizedSize: originalSize,
      reduction: 0,
      format: options.format,
      error: message,
    }
  }
}

function buildOutputName(format: AudioFormat): { name: string; container: string } {
  switch (format) {
    case 'mp3':
      return { name: `out_${Date.now()}.mp3`, container: 'mp3' }
    case 'aac':
      return { name: `out_${Date.now()}.m4a`, container: 'ipod' }
    case 'opus':
      return { name: `out_${Date.now()}.opus`, container: 'opus' }
    case 'ogg':
      return { name: `out_${Date.now()}.ogg`, container: 'ogg' }
    case 'flac':
      return { name: `out_${Date.now()}.flac`, container: 'flac' }
    case 'wav':
      return { name: `out_${Date.now()}.wav`, container: 'wav' }
  }
}

function buildArgs(input: string, output: string, opts: AudioOptimizeOptions): string[] {
  const args = ['-i', input, '-vn'] // drop any video stream
  const bitrate = qualityToBitrate(opts.quality, opts.format)

  switch (opts.format) {
    case 'mp3':
      // VBR (-q:a) produces better size/quality trade-off than CBR (-b:a) for MP3.
      args.push('-c:a', 'libmp3lame', '-q:a', mp3VbrQuality(opts.quality))
      break
    case 'aac':
      args.push('-c:a', 'aac', '-b:a', bitrate, '-movflags', '+faststart')
      break
    case 'opus':
      args.push('-c:a', 'libopus', '-b:a', bitrate, '-vbr', 'on')
      break
    case 'ogg':
      args.push('-c:a', 'libvorbis', '-b:a', bitrate)
      break
    case 'flac':
      args.push('-c:a', 'flac', '-compression_level', '5')
      break
    case 'wav':
      args.push('-c:a', 'pcm_s16le')
      break
  }

  args.push(output)
  return args
}

export function extensionForAudioFormat(format: AudioFormat): string {
  return format === 'aac' ? 'm4a' : format
}
