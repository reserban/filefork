'use client'

import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
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
  IMAGE_FORMATS,
  IMAGE_RESOLUTIONS,
  VIDEO_FORMATS,
  VIDEO_RESOLUTIONS,
} from './constants'
import type { UploadedFile } from './types'

interface FileSettingsProps {
  fileData: UploadedFile
  onUpdateFile: (id: string, updates: Partial<UploadedFile>) => void
}

/**
 * Per-file settings drawer. On mobile each control takes its own row with the
 * label above — full-width sliders and selects. On desktop (md+) the controls
 * flow inline with labels beside them, matching the tighter batch-controls UI.
 */
export function FileSettings({ fileData, onUpdateFile }: FileSettingsProps) {
  const isPdf = fileData.type === 'pdf'
  const isAudio = fileData.type === 'audio'
  const canSplit =
    fileData.type === 'image' &&
    ((fileData.originalHeight ?? 0) > 4000 || (fileData.originalWidth ?? 0) > 4000)

  const resolutionPresets = fileData.type === 'image' ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS
  const formatOptions =
    fileData.type === 'image' ? IMAGE_FORMATS :
    fileData.type === 'audio' ? AUDIO_FORMATS :
    VIDEO_FORMATS

  return (
    <div className="border-t border-border/60 bg-muted/20 px-4 md:px-4 py-3 md:py-4">
      <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2">
        {/* Quality — pushed to the right on desktop */}
        <FieldRow label="Quality" className="md:order-last md:ml-auto">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] md:w-56 md:flex-initial">
            <Slider
              value={[fileData.quality]}
              onValueChange={([value]) => onUpdateFile(fileData.id, { quality: value })}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-[11px] font-mono font-semibold tabular-nums w-9 text-right">
              {fileData.quality}%
            </span>
          </div>
        </FieldRow>

        {/* Format + resolution + slices (non-PDF) */}
        {!isPdf && (
          <>
            <FieldRow label="Format">
              <Select
                value={fileData.format}
                onValueChange={value => onUpdateFile(fileData.id, { format: value })}
              >
                <SelectTrigger className="h-8 w-full md:w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            {!isAudio && (
              <FieldRow label="Size">
                <Select
                  value={fileData.resolution}
                  onValueChange={value => onUpdateFile(fileData.id, { resolution: value })}
                >
                  <SelectTrigger className="h-8 w-full md:w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionPresets.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            {canSplit && (
              <FieldRow label="Slices">
                <Select
                  value={fileData.slices?.toString() ?? 'auto'}
                  onValueChange={v =>
                    onUpdateFile(fileData.id, { slices: v === 'auto' ? undefined : parseInt(v) })
                  }
                >
                  <SelectTrigger className="h-8 w-full md:w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    {[2, 3, 4, 5, 6, 8, 10].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
            )}

            {fileData.resolution === 'custom' && (
              <FieldRow label="Custom">
                <div className="flex items-center gap-1.5 w-full md:w-auto">
                  <Input
                    type="number"
                    placeholder="W"
                    value={fileData.customWidth || ''}
                    onChange={e =>
                      onUpdateFile(fileData.id, {
                        customWidth: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="h-8 flex-1 md:w-16 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">×</span>
                  <Input
                    type="number"
                    placeholder="H"
                    value={fileData.customHeight || ''}
                    onChange={e =>
                      onUpdateFile(fileData.id, {
                        customHeight: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="h-8 flex-1 md:w-16 text-xs"
                  />
                </div>
              </FieldRow>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Label + control pair that flows vertically on mobile (label on top, control below)
 * and horizontally on md+ (label inline with control). Label is the same mono small-caps
 * used across the tune panel.
 */
function FieldRow({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 md:flex-row md:items-center md:gap-2 ${className ?? ''}`}>
      <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/80 md:text-[11px]">
        {label}
      </span>
      {children}
    </div>
  )
}
