'use client'

import JSZip from 'jszip'
import type { OptimizedFile, Slice, UploadedFile } from './types'

/** Trigger a browser download for a single file buffer. */
export function downloadBuffer(name: string, buffer: ArrayBuffer): void {
  const blob = new Blob([buffer])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Package all slices for one file into a ZIP and download it. */
export async function downloadSlicesZip(fileData: UploadedFile, slices: Slice[]): Promise<void> {
  const zip = new JSZip()
  slices.forEach(({ name, buffer }) => zip.file(name, buffer))
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  const baseName = fileData.file.name.substring(0, fileData.file.name.lastIndexOf('.')) || fileData.file.name
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${baseName}_slices.zip`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Package every completed file into one ZIP. Split files get their own folder;
 * optimized-only files live at the archive root. Optimized slices win over raw
 * slices when both are present.
 */
export async function downloadBatchZip(
  files: UploadedFile[],
  optimizedFiles: Map<string, OptimizedFile>,
  splitResults: Map<string, Slice[]>,
  optimizedSplitResults: Map<string, Slice[]>,
): Promise<void> {
  const zip = new JSZip()

  for (const fileData of files) {
    const baseName = fileData.file.name.substring(0, fileData.file.name.lastIndexOf('.')) || fileData.file.name
    const optSlices = optimizedSplitResults.get(fileData.id)
    const rawSlices = splitResults.get(fileData.id)
    const optimized = optimizedFiles.get(fileData.id)

    if (optSlices) {
      const folder = zip.folder(baseName)!
      optSlices.forEach(({ name, buffer }) => folder.file(name, buffer))
    } else if (rawSlices) {
      const folder = zip.folder(baseName)!
      rawSlices.forEach(({ name, buffer }) => folder.file(name, buffer))
    } else if (optimized) {
      zip.file(optimized.name, optimized.buffer)
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
  const url = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'optimized-files.zip'
  link.click()
  URL.revokeObjectURL(url)
}
