'use client'

import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FileCard } from './FileCard'
import type { FileFilter, OptimizedFile, Slice, UploadedFile } from './types'

export interface FileListProps {
  filteredFiles: UploadedFile[]
  hasFiles: boolean
  fileTypeFilter: FileFilter
  setFileTypeFilter: (f: FileFilter) => void
  processing: Set<string>
  splitting: Set<string>
  optimizingSlices: Set<string>
  optimizedFiles: Map<string, OptimizedFile>
  splitResults: Map<string, Slice[]>
  optimizedSplitResults: Map<string, Slice[]>
  fileProgress: Map<string, number>
  fileStartedAt: Map<string, number>
  onRemove: (id: string) => void
  onToggleSettings: (id: string) => void
  onUpdateFile: (id: string, updates: Partial<UploadedFile>) => void
  onReset: (id: string) => void
  onDownload: (optimized: OptimizedFile) => void
  onDownloadSplitZip: (fileData: UploadedFile, slices: Slice[]) => void
  onOptimize: (fileData: UploadedFile) => void
  onSplit: (fileData: UploadedFile) => void
  onOptimizeSlices: (fileData: UploadedFile, slices: Slice[]) => void
}

/**
 * Vertical list of file cards. Renders an empty-state prompt when the active
 * filter matches zero files (but files exist in the batch).
 */
export function FileList(props: FileListProps) {
  const { filteredFiles, hasFiles, fileTypeFilter, setFileTypeFilter } = props

  if (hasFiles && filteredFiles.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <Package className="h-6 w-6 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground mb-4">
          No {fileTypeFilter === 'all' ? '' : fileTypeFilter} files in this view.
        </p>
        <Button onClick={() => setFileTypeFilter('all')} variant="outline" size="sm">
          Show all files
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {filteredFiles.map(fileData => (
        <FileCard
          key={fileData.id}
          fileData={fileData}
          isProcessing={props.processing.has(fileData.id)}
          isSplitting={props.splitting.has(fileData.id)}
          isOptimizingSlices={props.optimizingSlices.has(fileData.id)}
          optimized={props.optimizedFiles.get(fileData.id)}
          splitSlices={props.splitResults.get(fileData.id)}
          optimizedSplitSlices={props.optimizedSplitResults.get(fileData.id)}
          progress={props.fileProgress.get(fileData.id)}
          startedAt={props.fileStartedAt.get(fileData.id)}
          onRemove={props.onRemove}
          onToggleSettings={props.onToggleSettings}
          onUpdateFile={props.onUpdateFile}
          onReset={props.onReset}
          onDownload={props.onDownload}
          onDownloadSplitZip={props.onDownloadSplitZip}
          onOptimize={props.onOptimize}
          onSplit={props.onSplit}
          onOptimizeSlices={props.onOptimizeSlices}
        />
      ))}
    </div>
  )
}
