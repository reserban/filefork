'use client'

import { useMemo } from 'react'
import type { OptimizedFile, Slice, UploadedFile } from './types'

export interface FileStats {
  totalFiles: number
  optimizedCount: number
  totalSaved: number
  avgReduction: number
  totalSlicesSaved: number
  slicesAvgReduction: number
  /** All files have either been optimized or split-then-slice-optimized. */
  isComplete: boolean
}

/**
 * Memoized aggregate stats over the current batch. Recomputes only when
 * the underlying file/optimization maps change identity.
 */
export function useFileStats(
  files: UploadedFile[],
  optimizedFiles: Map<string, OptimizedFile>,
  splitResults: Map<string, Slice[]>,
  optimizedSplitResults: Map<string, Slice[]>,
): FileStats {
  return useMemo(() => {
    const totalFiles = files.length
    const optimizedCount = optimizedFiles.size

    const totalOriginalSize = Array.from(optimizedFiles.values()).reduce((sum, f) => sum + f.originalSize, 0)
    const totalOptimizedSize = Array.from(optimizedFiles.values()).reduce((sum, f) => sum + f.optimizedSize, 0)
    const totalSaved = totalOriginalSize - totalOptimizedSize
    const avgReduction = optimizedCount > 0
      ? Array.from(optimizedFiles.values()).reduce((sum, f) => sum + f.reduction, 0) / optimizedCount
      : 0

    let totalSlicesOriginalSize = 0
    let totalSlicesOptimizedSize = 0
    optimizedSplitResults.forEach((optSlices, id) => {
      const rawSlices = splitResults.get(id)
      if (rawSlices) {
        totalSlicesOriginalSize += rawSlices.reduce((sum, s) => sum + s.buffer.byteLength, 0)
        totalSlicesOptimizedSize += optSlices.reduce((sum, s) => sum + s.buffer.byteLength, 0)
      }
    })
    const totalSlicesSaved = totalSlicesOriginalSize - totalSlicesOptimizedSize
    const slicesAvgReduction = totalSlicesOriginalSize > 0
      ? (totalSlicesSaved / totalSlicesOriginalSize) * 100
      : 0

    const isComplete = totalFiles > 0 && files.every(f =>
      optimizedFiles.has(f.id) || (splitResults.has(f.id) && optimizedSplitResults.has(f.id))
    )

    return {
      totalFiles,
      optimizedCount,
      totalSaved,
      avgReduction,
      totalSlicesSaved,
      slicesAvgReduction,
      isComplete,
    }
  }, [files, optimizedFiles, splitResults, optimizedSplitResults])
}
