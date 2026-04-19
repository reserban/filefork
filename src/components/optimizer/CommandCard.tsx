'use client'

import {
  FileDown,
  Image as ImageIcon,
  Loader2,
  Music,
  Package,
  RotateCcw,
  Scissors,
  Settings2,
  Trash2,
  Upload,
  Video,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AUDIO_FORMATS,
  CONVERSION_PRESETS,
  IMAGE_FORMATS,
  VIDEO_FORMATS,
  type ConversionPreset,
} from './constants'
import type { FileFilter, Slice, UploadedFile } from './types'
import { formatSize } from './utils'

export interface CommandCardStats {
  totalFiles: number
  optimizedCount: number
  totalSaved: number
  avgReduction: number
  totalSlicesSaved: number
  slicesAvgReduction: number
  isComplete: boolean
}

export interface FileTypeCounts {
  total: number
  images: number
  videos: number
  audios: number
  pdfs: number
}

export interface CommandCardProps {
  // Live state
  files: UploadedFile[]
  processing: Set<string>
  splitting: Set<string>
  optimizingSlices: Set<string>
  splitResults: Map<string, Slice[]>

  // Derived
  stats: CommandCardStats
  totalFilesSize: number
  fileTypeCounts: FileTypeCounts
  optimizeAllCount: number
  splittableCount: number
  conversionPresetId: string
  sliderQualityValue: number
  imageFormatValue: string
  videoFormatValue: string
  audioFormatValue: string
  imageSlicesSelectValue: string
  advancedOpen: boolean

  // Filter
  fileTypeFilter: FileFilter
  setFileTypeFilter: (f: FileFilter) => void

  // Advanced toggle
  setAdvancedOpen: (v: boolean) => void

  // Actions
  openFilePicker: () => void
  optimizeAll: () => void
  splitAll: () => void
  downloadAllAsZip: () => void
  clearFiles: () => void
  resetAll: () => void
  applyPresetToAll: (value: number) => void
  applyConversionPreset: (p: ConversionPreset) => void
  applyFormatToAllImages: (f: string) => void
  applyFormatToAllVideos: (f: string) => void
  applyFormatToAllAudios: (f: string) => void
  setImageSlices: (value: string) => void
}

/**
 * The main control surface that appears once files are loaded.
 * One card, three stacked zones:
 *   1. State-aware headline + primary CTA (Optimize / Download ZIP)
 *   2. Inline tune controls (preset + quality) with an Advanced toggle
 *   3. File-type filter tabs + utility actions (Add / Reset / Clear)
 */
export function CommandCard(props: CommandCardProps) {
  const {
    files,
    processing,
    splitting,
    optimizingSlices,
    splitResults,
    stats,
    totalFilesSize,
    fileTypeCounts,
    optimizeAllCount,
    splittableCount,
    conversionPresetId,
    sliderQualityValue,
    imageFormatValue,
    videoFormatValue,
    audioFormatValue,
    imageSlicesSelectValue,
    advancedOpen,
    fileTypeFilter,
    setFileTypeFilter,
    setAdvancedOpen,
    openFilePicker,
    optimizeAll,
    splitAll,
    downloadAllAsZip,
    clearFiles,
    resetAll,
    applyPresetToAll,
    applyConversionPreset,
    applyFormatToAllImages,
    applyFormatToAllVideos,
    applyFormatToAllAudios,
    setImageSlices,
  } = props

  const isProcessing = processing.size > 0 || optimizingSlices.size > 0 || splitting.size > 0
  const busyCount = processing.size + optimizingSlices.size + splitting.size
  const activePreset = CONVERSION_PRESETS.find(p => p.id === conversionPresetId)
  const hasAdvancedControls =
    fileTypeCounts.images > 0 ||
    fileTypeCounts.videos > 0 ||
    fileTypeCounts.audios > 0 ||
    splittableCount > 0
  const hasCompletedWork = stats.optimizedCount > 0 || splitResults.size > 0

  const filterTabs = [
    { key: 'all' as FileFilter, icon: Package, label: 'All', count: fileTypeCounts.total, always: true },
    { key: 'image' as FileFilter, icon: ImageIcon, label: 'Images', count: fileTypeCounts.images, always: false },
    { key: 'video' as FileFilter, icon: Video, label: 'Videos', count: fileTypeCounts.videos, always: false },
    { key: 'audio' as FileFilter, icon: Music, label: 'Audio', count: fileTypeCounts.audios, always: false },
    { key: 'pdf' as FileFilter, icon: FileDown, label: 'PDFs', count: fileTypeCounts.pdfs, always: false },
  ].filter(t => t.always || t.count > 0)

  return (
    <div className="rounded-2xl border-2 border-foreground/15 bg-card overflow-hidden">
      {/* Top zone: state headline + primary CTA */}
      <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-5">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight tabular-nums">
            {stats.isComplete ? (
              <>
                Saved <span className="text-primary">{formatSize(stats.totalSaved + stats.totalSlicesSaved)}</span>
              </>
            ) : isProcessing ? (
              <>
                Processing <span className="text-primary">{busyCount}</span> of {stats.totalFiles}…
              </>
            ) : (
              <>
                {stats.totalFiles} {stats.totalFiles === 1 ? 'file' : 'files'} ·{' '}
                <span className="text-muted-foreground/70">{formatSize(totalFilesSize)}</span>
              </>
            )}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            {stats.isComplete ? (
              <>
                {stats.optimizedCount} optimized · {stats.avgReduction.toFixed(0)}% average reduction
              </>
            ) : (
              <>
                {activePreset?.label ?? 'Custom'} · {sliderQualityValue}% quality
                <span className="hidden md:inline ml-1 text-muted-foreground/60">- tweak below or just hit optimize</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0">
          {splittableCount > 0 && !stats.isComplete && (
            <Button
              onClick={splitAll}
              disabled={isProcessing}
              variant="outline"
              size="lg"
              className="flex-1 md:flex-initial gap-1.5 h-11"
              title={`Split ${splittableCount} image${splittableCount > 1 ? 's' : ''} taller than 4000px into slices`}
            >
              {splitting.size > 0 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Splitting…
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4" /> Split {splittableCount}
                </>
              )}
            </Button>
          )}
          {stats.isComplete ? (
            <Button
              onClick={downloadAllAsZip}
              size="lg"
              className="flex-1 md:flex-initial gap-2 h-11 px-6 bg-primary text-primary-foreground hover:brightness-110"
            >
              <Package className="h-4 w-4" />
              Download ZIP
            </Button>
          ) : (
            <Button
              onClick={optimizeAll}
              disabled={isProcessing || files.length === 0}
              size="lg"
              className="flex-1 md:flex-initial gap-2 h-11 px-6 bg-primary text-primary-foreground hover:brightness-110"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Optimize {optimizeAllCount > 0 ? optimizeAllCount : ''}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Middle zone: inline controls (preset + quality + advanced toggle) */}
      <div className="border-t border-foreground/10 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 flex-wrap">
        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Presets
        </span>

        {/* Preset — segmented pill control */}
        <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
          {CONVERSION_PRESETS.map(p => {
            const PIcon = p.icon
            const active = conversionPresetId === p.id
            return (
              <button
                key={p.id}
                onClick={() => applyConversionPreset(p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={p.description}
              >
                <PIcon
                  className={`h-3.5 w-3.5 ${active ? 'text-primary' : ''}`}
                  strokeWidth={2}
                />
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Advanced — mobile: own row below Quality (right-aligned). Desktop: last item after slider. */}
        {hasAdvancedControls && (
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className={`order-3 md:order-3 ml-auto md:ml-0 inline-flex items-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-1.5 rounded-md shrink-0 ${
              advancedOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Override output formats and slice settings"
            aria-expanded={advancedOpen}
          >
            <Settings2
              className={`h-3.5 w-3.5 transition-transform duration-150 ${advancedOpen ? 'rotate-90' : ''}`}
            />
            Advanced
          </button>
        )}

        {/* Quality slider — mobile: label on top, slider full width below. Desktop: inline, right-aligned. */}
        <div className="order-2 md:order-2 w-full md:w-60 md:flex-initial md:ml-auto flex flex-col gap-1.5 md:flex-row md:items-center md:gap-2.5">
          <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground/80 md:text-muted-foreground">
            Quality
          </span>
          <div className="flex items-center gap-2.5 md:flex-1">
            <Slider
              value={[sliderQualityValue]}
              onValueChange={([value]) => applyPresetToAll(value)}
              min={20}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-xs font-mono font-semibold tabular-nums w-9 text-right">
              {sliderQualityValue}%
            </span>
          </div>
        </div>
      </div>

      {/* Advanced panel — expands inline as a new zone below the middle row */}
      {advancedOpen && hasAdvancedControls && (
        <div className="border-t border-foreground/10 px-4 md:px-6 py-3 md:py-4 bg-muted/20">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
              Output
            </span>
            {fileTypeCounts.images > 0 && (
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Images</span>
                <Select value={imageFormatValue} onValueChange={applyFormatToAllImages}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_FORMATS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {fileTypeCounts.videos > 0 && (
              <div className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Videos</span>
                <Select value={videoFormatValue} onValueChange={applyFormatToAllVideos}>
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_FORMATS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {fileTypeCounts.audios > 0 && (
              <div className="flex items-center gap-2">
                <Music className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Audio</span>
                <Select value={audioFormatValue} onValueChange={applyFormatToAllAudios}>
                  <SelectTrigger className="h-8 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIO_FORMATS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {splittableCount > 0 && (
              <>
                <span className="hidden md:inline h-5 w-px bg-foreground/10" />
                <div className="flex items-center gap-2">
                  <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Slice tall <span className="text-muted-foreground/60">({splittableCount})</span>
                  </span>
                  <Select value={imageSlicesSelectValue} onValueChange={setImageSlices}>
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      {[2, 3, 4, 5, 6, 8, 10].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom zone: filter (tabs on desktop, dropdown on mobile) + utility actions */}
      <div className="border-t border-foreground/10 px-2 md:px-4 flex items-center justify-between gap-2">
        {/* Mobile: slim inline dropdown */}
        <div className="flex md:hidden items-center py-2 pl-2">
          <Select
            value={fileTypeFilter}
            onValueChange={v => setFileTypeFilter(v as FileFilter)}
          >
            <SelectTrigger className="h-8 w-auto gap-1.5 border-0 bg-transparent px-2 text-xs font-medium text-muted-foreground hover:text-foreground focus:ring-0 focus-visible:ring-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterTabs.map(t => {
                const TIcon = t.icon
                return (
                  <SelectItem key={t.key} value={t.key}>
                    <span className="inline-flex items-center gap-2">
                      <TIcon className="h-3.5 w-3.5" />
                      {t.label}
                      <span className="tabular-nums text-muted-foreground/70">{t.count}</span>
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: tab bar */}
        <div className="hidden md:flex items-center min-w-0 flex-wrap">
          {filterTabs.map(t => {
            const TIcon = t.icon
            const active = fileTypeFilter === t.key
            return (
              <button
                key={t.key}
                onClick={() => setFileTypeFilter(t.key)}
                className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap -mb-px border-b-2 ${
                  active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <TIcon className="h-3.5 w-3.5" />
                {t.label}
                <span className={`tabular-nums ${active ? 'text-primary font-semibold' : 'text-muted-foreground/70'}`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 py-1">
          <Button
            onClick={openFilePicker}
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground px-2 md:px-3"
            title="Add more files"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Add</span>
          </Button>
          {hasCompletedWork && (
            <Button
              onClick={resetAll}
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground px-2 md:px-3"
              title="Undo all optimizations"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Reset</span>
            </Button>
          )}
          <Button
            onClick={clearFiles}
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground px-2 md:px-3"
            title="Remove all files"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Clear</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
