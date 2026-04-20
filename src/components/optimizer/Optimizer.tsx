'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loadFFmpeg } from '@/lib/optimizer/client-video-optimizer'
import { optimizeImageClient } from '@/lib/optimizer/client-image-optimizer'
import { extensionForAudioFormat, type AudioFormat } from '@/lib/optimizer/client-audio-optimizer'
import type { UploadedFile, OptimizedFile, Slice, FileFilter } from './types'
import { type ConversionPreset } from './constants'
import {
  estimateOptimization,
  detectFileKind,
  sameFormatOutput,
} from './utils'
import { DropOverlay } from './DropOverlay'
import { Hero } from './Hero'
import { Features } from './Features'
import { CommandCard } from './CommandCard'
import { FileList } from './FileList'
import { useWindowDrag } from '@/hooks/use-window-drag'
import { readInitialUrlPrefs, useUrlPrefs } from '@/hooks/use-url-prefs'
import { extractFromZip, makeUploadedFile } from './intake-utils'
import { downloadBatchZip, downloadBuffer, downloadSlicesZip } from './downloads'
import { sliceImage } from './split-image'
import { useFileStats } from './use-file-stats'
import { runOptimization } from './run-optimization'

export default function Optimizer() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [optimizedFiles, setOptimizedFiles] = useState<Map<string, OptimizedFile>>(new Map())
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [fileTypeFilter, setFileTypeFilter] = useState<FileFilter>('all')

  // Overall/global settings — seeded from URL so they survive reloads and can be
  // shared via a bookmarked link. Only the top-level controls update these; per-file
  // tweaks via the FileSettings drawer intentionally do not touch the URL.
  // URL is read post-mount (in useEffect below) to keep SSR and hydration identical.
  const { setPref } = useUrlPrefs()
  const [conversionPresetId, setConversionPresetId] = useState<string>('web')
  const initialPrefsRef = useRef<ReturnType<typeof readInitialUrlPrefs>>({})

  useEffect(() => {
    const initial = readInitialUrlPrefs()
    initialPrefsRef.current = initial
    if (initial.preset && ['web', 'keep'].includes(initial.preset)) {
      // One-shot sync from window.location on mount — no cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversionPresetId(initial.preset)
    }
  }, [])

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [videoProcessingAvailable, setVideoProcessingAvailable] = useState<boolean | null>(null)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [splitting, setSplitting] = useState<Set<string>>(new Set())
  const [splitResults, setSplitResults] = useState<Map<string, { name: string; buffer: ArrayBuffer }[]>>(new Map())
  const [optimizedSplitResults, setOptimizedSplitResults] = useState<Map<string, { name: string; buffer: ArrayBuffer }[]>>(new Map())
  const [optimizingSlices, setOptimizingSlices] = useState<Set<string>>(new Set())
  const [fileProgress, setFileProgress] = useState<Map<string, number>>(new Map())
  const [fileStartedAt, setFileStartedAt] = useState<Map<string, number>>(new Map())

  // Refs for stable useCallback closures — lets async handlers read latest state without deps
  const videoProcessingAvailableRef = useRef<boolean | null>(null)
  const optimizedFilesRef = useRef<Map<string, OptimizedFile>>(new Map())

  // Window-level drag detection for the full-page drop catcher
  const windowDragActive = useWindowDrag()

  // Full reset — triggered by the header brand link so clicking the logo from
  // the dashboard view returns to the empty hero state.
  useEffect(() => {
    const handleReset = () => {
      setFiles([])
      setOptimizedFiles(new Map())
      setSplitResults(new Map())
      setOptimizedSplitResults(new Map())
      setProcessing(new Set())
      setSplitting(new Set())
      setOptimizingSlices(new Set())
      setFileProgress(new Map())
      setFileStartedAt(new Map())
      setError(null)
      setFileTypeFilter('all')
      setAdvancedOpen(false)
    }
    window.addEventListener('filefork:reset', handleReset)
    return () => window.removeEventListener('filefork:reset', handleReset)
  }, [])

  // Preload FFmpeg when video OR audio files are added (shared WASM module)
  useEffect(() => {
    const needsFFmpeg = files.some(f => f.type === 'video' || f.type === 'audio')

    if (needsFFmpeg && videoProcessingAvailable === null && !ffmpegLoading) {
      // Gate: starts a one-time FFmpeg load when video/audio first appears.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFfmpegLoading(true)
      loadFFmpeg()
        .then(() => {
          setVideoProcessingAvailable(true)
          setFfmpegLoading(false)
        })
        .catch((err) => {
          console.error('FFmpeg preload failed:', err)
          setVideoProcessingAvailable(false)
          setFfmpegLoading(false)
          setError('Video optimization is not available in this browser. Images will still be optimized.')
        })
    }
  }, [files, videoProcessingAvailable, ffmpegLoading])

  // Keep refs in sync so stable useCallback closures read latest values
  useEffect(() => { videoProcessingAvailableRef.current = videoProcessingAvailable }, [videoProcessingAvailable])
  useEffect(() => { optimizedFilesRef.current = optimizedFiles }, [optimizedFiles])

  const stats = useFileStats(files, optimizedFiles, splitResults, optimizedSplitResults)

  // Filter files by type
  const filteredFiles = useMemo(() => {
    if (fileTypeFilter === 'all') return files
    return files.filter(f => f.type === fileTypeFilter)
  }, [files, fileTypeFilter])

  // File type counts
  const fileTypeCounts = useMemo(() => {
    const images = files.filter(f => f.type === 'image').length
    const videos = files.filter(f => f.type === 'video').length
    const audios = files.filter(f => f.type === 'audio').length
    const pdfs = files.filter(f => f.type === 'pdf').length
    return { images, videos, audios, pdfs, total: files.length }
  }, [files])

  // Expensive computed values used in the controls/stats panel
  const totalFilesSize = useMemo(
    () => files.reduce((sum, f) => sum + f.file.size, 0),
    [files]
  )

  const splittableCount = useMemo(
    () => files.filter(f =>
      f.type === 'image' && !splitResults.has(f.id) &&
      ((f.originalHeight ?? 0) > 4000 || (f.originalWidth ?? 0) > 4000)
    ).length,
    [files, splitResults]
  )

  const optimizeAllCount = useMemo(
    () => files.filter(f =>
      splitResults.has(f.id) ? !optimizedSplitResults.has(f.id) : !optimizedFiles.has(f.id)
    ).length,
    [files, splitResults, optimizedSplitResults, optimizedFiles]
  )

  const imageSlicesSelectValue = useMemo(() => {
    const imageSlices = files.filter(f => f.type === 'image').map(f => f.slices)
    const allSame = imageSlices.length > 0 && imageSlices.every(s => s === imageSlices[0])
    return allSame ? (imageSlices[0]?.toString() ?? 'auto') : 'auto'
  }, [files])

  const sliderQualityValue = useMemo(() => {
    if (files.length === 0) return 80
    if (files.every(f => f.quality === files[0].quality)) return files[0].quality
    return Math.round(files.reduce((sum, f) => sum + f.quality, 0) / files.length)
  }, [files])

  const imageFormatValue = useMemo(
    () => files.find(f => f.type === 'image')?.format ?? 'webp',
    [files]
  )

  const videoFormatValue = useMemo(
    () => files.find(f => f.type === 'video')?.format ?? 'mp4-h264',
    [files]
  )

  const audioFormatValue = useMemo(
    () => files.find(f => f.type === 'audio')?.format ?? 'mp3',
    [files]
  )

  // Dropzone accepts every supported type — detection happens post-drop
  const dropzoneAccept = useMemo(() => ({
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.heic', '.heif', '.tiff', '.tif', '.bmp', '.svg', '.jfif', '.ico'],
    'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp'],
    'audio/*': ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.opus', '.wma', '.aiff'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
  }), [])

  // Drag and drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const isZip = (f: File) =>
      f.type === 'application/zip' ||
      f.type === 'application/x-zip-compressed' ||
      f.name.toLowerCase().endsWith('.zip')

    const zipFiles = acceptedFiles.filter(isZip)
    const directFiles = acceptedFiles.filter(f => !isZip(f))

    let extractedArrays: File[][] = []
    try {
      extractedArrays = await Promise.all(zipFiles.map(extractFromZip))
    } catch (err) {
      console.error('Error extracting ZIP:', err)
      setError('Failed to extract files from ZIP archive')
    }
    const all = [...directFiles, ...extractedArrays.flat()].filter(f => detectFileKind(f))

    if (all.length === 0) {
      if (zipFiles.length > 0) {
        setError('No supported files (images, videos, audio, PDFs) found in the ZIP archive(s)')
      }
      return
    }

    const largeVideos = all.filter(f =>
      (f.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(f.name)) &&
      f.size > 200 * 1024 * 1024
    )
    if (largeVideos.length > 0) {
      setError(`Heads up: ${largeVideos.length} video(s) exceed 200MB. Very large files may be slow to process in browser.`)
    }

    const newFiles = await Promise.all(all.map(f => makeUploadedFile(f, initialPrefsRef.current)))
    setFiles(prev => [...prev, ...newFiles])
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: dropzoneAccept,
    multiple: true,
    noClick: true,
    noKeyboard: true,
  })

  // Remove file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setOptimizedFiles((prev) => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  // Update file settings
  const updateFile = useCallback((id: string, updates: Partial<UploadedFile>) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, ...updates }
        const estimate = estimateOptimization(
          updated.file,
          updated.type,
          updated.quality,
          updated.format,
          updated.resolution,
          updated.customWidth,
          updated.customHeight,
          updated.originalWidth,
          updated.originalHeight
        )
        return {
          ...updated,
          estimatedSize: estimate.estimatedSize,
          estimatedReduction: estimate.estimatedReduction,
        }
      })
    )
  }, [])

  // Apply global quality to every file (and persist to URL)
  const applyPresetToAll = (quality: number) => {
    setPref('quality', quality)
    setFiles((prev) =>
      prev.map((f) => {
        const updated = { ...f, quality }
        const estimate = estimateOptimization(
          updated.file,
          updated.type,
          updated.quality,
          updated.format,
          updated.resolution,
          updated.customWidth,
          updated.customHeight,
          updated.originalWidth,
          updated.originalHeight
        )
        return {
          ...updated,
          estimatedSize: estimate.estimatedSize,
          estimatedReduction: estimate.estimatedReduction,
        }
      })
    )
  }

  // Apply format to all images (and persist to URL)
  const applyFormatToAllImages = (format: string) => {
    setPref('image', format)
    setFiles((prev) =>
      prev.map((f) => {
        if (f.type !== 'image') return f
        const updated = { ...f, format }
        const estimate = estimateOptimization(
          updated.file,
          updated.type,
          updated.quality,
          updated.format,
          updated.resolution,
          updated.customWidth,
          updated.customHeight,
          updated.originalWidth,
          updated.originalHeight
        )
        return {
          ...updated,
          estimatedSize: estimate.estimatedSize,
          estimatedReduction: estimate.estimatedReduction,
        }
      })
    )
  }

  // Apply format to all videos (and persist to URL)
  const applyFormatToAllVideos = (format: string) => {
    setPref('video', format)
    setFiles((prev) =>
      prev.map((f) => {
        if (f.type !== 'video') return f
        const updated = { ...f, format }
        const estimate = estimateOptimization(
          updated.file,
          updated.type,
          updated.quality,
          updated.format,
          updated.resolution,
          updated.customWidth,
          updated.customHeight,
          updated.originalWidth,
          updated.originalHeight
        )
        return {
          ...updated,
          estimatedSize: estimate.estimatedSize,
          estimatedReduction: estimate.estimatedReduction,
        }
      })
    )
  }

  // Apply format to all audios (and persist to URL)
  const applyFormatToAllAudios = (format: string) => {
    setPref('audio', format)
    setFiles((prev) =>
      prev.map((f) => {
        if (f.type !== 'audio') return f
        const updated = { ...f, format }
        const estimate = estimateOptimization(
          updated.file, updated.type, updated.quality, updated.format,
          updated.resolution, updated.customWidth, updated.customHeight,
          updated.originalWidth, updated.originalHeight
        )
        return { ...updated, estimatedSize: estimate.estimatedSize, estimatedReduction: estimate.estimatedReduction }
      })
    )
  }

  // Apply a conversion preset to every matching file (and persist to URL)
  const applyConversionPreset = useCallback((preset: ConversionPreset) => {
    setConversionPresetId(preset.id)
    // Default preset is "web" — keep URL clean by dropping the param in that case
    setPref('preset', preset.id === 'web' ? null : preset.id)
    // Changing preset invalidates any per-type format overrides
    setPref('image', null)
    setPref('video', null)
    setPref('audio', null)
    setFiles(prev =>
      prev.map(f => {
        let nextFormat = f.format
        if (preset.id === 'keep') {
          // Reset every file back to its input-matched output format
          nextFormat = sameFormatOutput(f.file, f.type)
        } else if (f.type === 'image' && preset.image) {
          nextFormat = preset.image
        } else if (f.type === 'video' && preset.video) {
          nextFormat = preset.video
        } else if (f.type === 'audio' && preset.audio) {
          nextFormat = preset.audio
        }
        const nextQuality = preset.quality ?? f.quality
        const updated = { ...f, format: nextFormat, quality: nextQuality }
        const est = estimateOptimization(
          updated.file, updated.type, updated.quality, updated.format, updated.resolution,
          updated.customWidth, updated.customHeight, updated.originalWidth, updated.originalHeight
        )
        return { ...updated, estimatedSize: est.estimatedSize, estimatedReduction: est.estimatedReduction }
      })
    )
  }, [setPref])

  // Toggle settings visibility
  const toggleSettings = useCallback((id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, showSettings: !f.showSettings } : f)))
  }, [])

  // Optimize single file — thin orchestration layer around runOptimization().
  const optimizeFile = useCallback(async (fileData: UploadedFile) => {
    setProcessing(prev => new Set(prev).add(fileData.id))
    setFileStartedAt(prev => new Map(prev).set(fileData.id, Date.now()))
    setFileProgress(prev => { const m = new Map(prev); m.delete(fileData.id); return m })
    setError(null)

    try {
      const output = await runOptimization(fileData, {
        videoProcessingAvailable: videoProcessingAvailableRef.current,
        onProgress: (pct) => setFileProgress(prev => new Map(prev).set(fileData.id, pct)),
        onVideoUnavailable: () => setVideoProcessingAvailable(false),
      })

      // Safety net: if the re-encode got bigger than the source (common for
      // already-compressed images and low-bitrate MP3s), keep the original.
      // Videos and PDFs are always re-encoded regardless.
      if ((fileData.type === 'image' || fileData.type === 'audio') && output.optimizedSize >= output.originalSize) {
        const originalBuffer = await fileData.file.arrayBuffer()
        setOptimizedFiles(prev => new Map(prev).set(fileData.id, {
          id: fileData.id,
          name: fileData.file.name,
          buffer: originalBuffer,
          originalSize: fileData.file.size,
          optimizedSize: fileData.file.size,
          reduction: 0,
          width: fileData.originalWidth || output.width,
          height: fileData.originalHeight || output.height,
          keptOriginal: true,
        }))
        return
      }

      // Derive the output extension (differs from fileData.format for video
      // containers and audio where AAC→.m4a, etc.)
      let extension = output.outputFormat || fileData.format
      if (fileData.type === 'video') {
        extension = fileData.format.startsWith('webm') ? 'webm' : fileData.format === 'gif' ? 'gif' : 'mp4'
      } else if (fileData.type === 'audio') {
        extension = extensionForAudioFormat(fileData.format as AudioFormat)
      }

      const originalNameWithoutExt = fileData.file.name.substring(0, fileData.file.name.lastIndexOf('.')) || fileData.file.name
      setOptimizedFiles(prev => new Map(prev).set(fileData.id, {
        id: fileData.id,
        name: `${originalNameWithoutExt}.${extension}`,
        buffer: output.buffer,
        originalSize: output.originalSize,
        optimizedSize: output.optimizedSize,
        reduction: output.reduction,
        width: output.width,
        height: output.height,
      }))
    } catch (err) {
      console.error('Optimization error:', err)
      setError(err instanceof Error ? err.message : 'Failed to optimize file')
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(fileData.id); return s })
      setFileProgress(prev => { const m = new Map(prev); m.delete(fileData.id); return m })
      setFileStartedAt(prev => { const m = new Map(prev); m.delete(fileData.id); return m })
    }
  }, [])

  // Slice a tall/wide image into panels. Uses the optimized buffer if one
  // exists so slices inherit whatever format the optimize pass produced.
  const splitImage = useCallback(async (fileData: UploadedFile) => {
    setSplitting(prev => new Set(prev).add(fileData.id))
    try {
      const slices = await sliceImage(fileData, optimizedFilesRef.current.get(fileData.id))
      setSplitResults(prev => new Map(prev).set(fileData.id, slices))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split image')
    } finally {
      setSplitting(prev => { const s = new Set(prev); s.delete(fileData.id); return s })
    }
  }, [])

  // Optimize each slice client-side and store results
  const optimizeSlices = useCallback(async (fileData: UploadedFile, slices: Slice[]) => {
    setOptimizingSlices((prev) => new Set(prev).add(fileData.id))
    try {
      const mimeType = fileData.file.type || 'image/png'
      const targetFormat = fileData.format as 'jpeg' | 'png' | 'webp' | 'avif' | 'gif'
      const optimizedSlices: { name: string; buffer: ArrayBuffer }[] = []

      for (const slice of slices) {
        const sliceFile = new File([slice.buffer], slice.name, { type: mimeType })
        const result = await optimizeImageClient(sliceFile, { quality: fileData.quality, format: targetFormat })
        if (!result.success || !result.buffer) throw new Error(`Failed to optimize slice: ${slice.name}`)
        const outputFormat = result.format || targetFormat
        const baseName = slice.name.substring(0, slice.name.lastIndexOf('.')) || slice.name
        optimizedSlices.push({ name: `${baseName}.${outputFormat}`, buffer: result.buffer })
      }

      setOptimizedSplitResults((prev) => new Map(prev).set(fileData.id, optimizedSlices))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize slices')
    } finally {
      setOptimizingSlices((prev) => { const s = new Set(prev); s.delete(fileData.id); return s })
    }
  }, [])

  const downloadSplitZip = useCallback(
    (fileData: UploadedFile, slices: Slice[]) => downloadSlicesZip(fileData, slices),
    [],
  )

  // Reset all processing state for a single file back to original
  const resetFile = useCallback((id: string) => {
    setOptimizedFiles((prev) => { const m = new Map(prev); m.delete(id); return m })
    setSplitResults((prev) => { const m = new Map(prev); m.delete(id); return m })
    setOptimizedSplitResults((prev) => { const m = new Map(prev); m.delete(id); return m })
  }, [])

  const downloadFile = useCallback((optimized: OptimizedFile) => {
    downloadBuffer(optimized.name, optimized.buffer)
  }, [])

  // Optimize all files
  const optimizeAll = async () => {
    // Files that still need optimization: split files -> optimize slices; others -> optimize file
    const filesToProcess = files.filter(f =>
      splitResults.has(f.id) ? !optimizedSplitResults.has(f.id) : !optimizedFiles.has(f.id)
    )

    for (const file of filesToProcess) {
      try {
        if (splitResults.has(file.id)) {
          await optimizeSlices(file, splitResults.get(file.id)!)
        } else {
          await optimizeFile(file)
        }
      } catch (err) {
        console.error(`Failed to optimize ${file.file.name}:`, err)
      }
    }
  }

  // Split all qualifying images (height or width > 4000px, not yet split)
  const splitAll = async () => {
    const filesToSplit = files.filter(
      f =>
        f.type === 'image' &&
        !splitResults.has(f.id) &&
        ((f.originalHeight ?? 0) > 4000 || (f.originalWidth ?? 0) > 4000)
    )
    for (const file of filesToSplit) {
      await splitImage(file)
    }
  }

  const downloadAllAsZip = async () => {
    try {
      setError(null)
      await downloadBatchZip(files, optimizedFiles, splitResults, optimizedSplitResults)
    } catch (err) {
      setError('Failed to create ZIP file')
      console.error('ZIP error:', err)
    }
  }


  // Empty-state landing: hero + features, plus fullscreen drop catcher
  if (files.length === 0) {
    return (
      <>
        <DropOverlay
          isDragActive={isDragActive}
          windowDragActive={windowDragActive}
          headline="Drop to optimize"
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />
        <Hero onChoose={open} error={error} />
        <Features />
      </>
    )
  }


  // Normal layout when files exist
  return (
    <div className="relative min-h-[calc(100vh-12rem)] max-w-6xl mx-auto px-4 md:px-6 pt-5 md:pt-6 pb-10 md:pb-14">
      <DropOverlay
        isDragActive={isDragActive}
        windowDragActive={windowDragActive}
        headline="Drop to add more"
        subline="Release anywhere,rem we'll queue them up"
        getRootProps={getRootProps}
        getInputProps={getInputProps}
      />

      <div className="relative z-10 space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      {files.length > 0 && (
        <CommandCard
          files={files}
          processing={processing}
          splitting={splitting}
          optimizingSlices={optimizingSlices}
          splitResults={splitResults}
          stats={stats}
          totalFilesSize={totalFilesSize}
          fileTypeCounts={fileTypeCounts}
          optimizeAllCount={optimizeAllCount}
          splittableCount={splittableCount}
          conversionPresetId={conversionPresetId}
          sliderQualityValue={sliderQualityValue}
          imageFormatValue={imageFormatValue}
          videoFormatValue={videoFormatValue}
          audioFormatValue={audioFormatValue}
          imageSlicesSelectValue={imageSlicesSelectValue}
          advancedOpen={advancedOpen}
          fileTypeFilter={fileTypeFilter}
          setFileTypeFilter={setFileTypeFilter}
          setAdvancedOpen={setAdvancedOpen}
          openFilePicker={open}
          optimizeAll={optimizeAll}
          splitAll={splitAll}
          downloadAllAsZip={downloadAllAsZip}
          clearFiles={() => { setFiles([]); setOptimizedFiles(new Map()) }}
          resetAll={() => {
            setOptimizedFiles(new Map())
            setSplitResults(new Map())
            setOptimizedSplitResults(new Map())
          }}
          applyPresetToAll={applyPresetToAll}
          applyConversionPreset={applyConversionPreset}
          applyFormatToAllImages={applyFormatToAllImages}
          applyFormatToAllVideos={applyFormatToAllVideos}
          applyFormatToAllAudios={applyFormatToAllAudios}
          setImageSlices={(value) => {
            setPref('slices', value === 'auto' ? null : value)
            const slices = value === 'auto' ? undefined : parseInt(value)
            setFiles(prev => prev.map(f => f.type === 'image' ? { ...f, slices } : f))
          }}
        />
      )}


      <FileList
        filteredFiles={filteredFiles}
        hasFiles={files.length > 0}
        fileTypeFilter={fileTypeFilter}
        setFileTypeFilter={setFileTypeFilter}
        processing={processing}
        splitting={splitting}
        optimizingSlices={optimizingSlices}
        optimizedFiles={optimizedFiles}
        splitResults={splitResults}
        optimizedSplitResults={optimizedSplitResults}
        fileProgress={fileProgress}
        fileStartedAt={fileStartedAt}
        onRemove={removeFile}
        onToggleSettings={toggleSettings}
        onUpdateFile={updateFile}
        onReset={resetFile}
        onDownload={downloadFile}
        onDownloadSplitZip={downloadSplitZip}
        onOptimize={optimizeFile}
        onSplit={splitImage}
        onOptimizeSlices={optimizeSlices}
      />
      </div>
    </div>
  )
}
