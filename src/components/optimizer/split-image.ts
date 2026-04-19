'use client'

import type { OptimizedFile, Slice, UploadedFile } from './types'

const MAX_SLICE_PX = 4000

/**
 * Slice a tall/wide image into panels no larger than MAX_SLICE_PX in the
 * dominant axis. If an optimized version is already available, slice that
 * (better visual quality at smaller size); otherwise slice the original.
 * Returns the slices as Blob-backed ArrayBuffers ready to zip or optimize.
 */
export async function sliceImage(
  fileData: UploadedFile,
  optimizedEntry: OptimizedFile | undefined,
): Promise<Slice[]> {
  let imgSrc: string
  let blobToRevoke: string | null = null
  if (optimizedEntry) {
    imgSrc = URL.createObjectURL(new Blob([optimizedEntry.buffer]))
    blobToRevoke = imgSrc
  } else {
    imgSrc = fileData.preview
  }

  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imgSrc
    })

    const { naturalWidth: imgWidth, naturalHeight: imgHeight } = img
    const splitVertically = imgHeight >= imgWidth
    const totalLength = splitVertically ? imgHeight : imgWidth
    const sliceCount = fileData.slices ?? Math.ceil(totalLength / MAX_SLICE_PX)
    const sliceSize = Math.ceil(totalLength / sliceCount)

    const sourceName = optimizedEntry ? optimizedEntry.name : fileData.file.name
    const mimeType = optimizedEntry
      ? (sourceName.endsWith('.webp') ? 'image/webp'
        : sourceName.endsWith('.png') ? 'image/png'
        : sourceName.endsWith('.jpg') || sourceName.endsWith('.jpeg') ? 'image/jpeg'
        : fileData.file.type || 'image/png')
      : (fileData.file.type || 'image/png')
    const ext = sourceName.split('.').pop() || 'png'
    const baseName = fileData.file.name.substring(0, fileData.file.name.lastIndexOf('.')) || fileData.file.name

    const slices: Slice[] = []
    for (let i = 0; i < sliceCount; i++) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      if (splitVertically) {
        const startY = i * sliceSize
        const sliceHeight = Math.min(sliceSize, imgHeight - startY)
        canvas.width = imgWidth
        canvas.height = sliceHeight
        ctx.drawImage(img, 0, startY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight)
      } else {
        const startX = i * sliceSize
        const sliceWidth = Math.min(sliceSize, imgWidth - startX)
        canvas.width = sliceWidth
        canvas.height = imgHeight
        ctx.drawImage(img, startX, 0, sliceWidth, imgHeight, 0, 0, sliceWidth, imgHeight)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), mimeType, 0.95)
      })
      slices.push({ name: `${baseName}_slice_${i + 1}.${ext}`, buffer: await blob.arrayBuffer() })
    }

    return slices
  } finally {
    if (blobToRevoke) URL.revokeObjectURL(blobToRevoke)
  }
}
