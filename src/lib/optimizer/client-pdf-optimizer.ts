import { PDFDocument } from "pdf-lib"

export interface PdfOptimizeOptions {
  /** Image quality 0-100. Lower = smaller file, more image degradation */
  quality: number
  /** Whether to strip metadata */
  stripMetadata?: boolean
}

// Browser canvas max dimension (conservative — most browsers support 16384)
const MAX_CANVAS_DIM = 8192

/**
 * Compress a PDF client-side by rendering each page to a JPEG canvas
 * and rebuilding the PDF from those images.
 *
 * Quality mapping:
 * - 90-100: 150 DPI, JPEG 92% — minimal quality loss
 * - 70-89:  120 DPI, JPEG 80% — good balance
 * - 50-69:  100 DPI, JPEG 65% — significant compression
 * - <50:     72 DPI, JPEG 50% — maximum compression
 */
export async function optimizePdfClient(
  file: File,
  options: PdfOptimizeOptions = { quality: 80 }
): Promise<{ buffer: ArrayBuffer; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer()

  const pdfjsLib = await import("pdfjs-dist")
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) })
  const pdfSource = await loadingTask.promise
  const pageCount = pdfSource.numPages

  const q = options.quality
  const dpi = q >= 90 ? 150 : q >= 70 ? 120 : q >= 50 ? 100 : 72
  const jpegQuality = q >= 90 ? 0.92 : q >= 70 ? 0.80 : q >= 50 ? 0.65 : 0.50

  const newPdf = await PDFDocument.create()

  if (options.stripMetadata !== false) {
    newPdf.setTitle("")
    newPdf.setAuthor("")
    newPdf.setSubject("")
    newPdf.setKeywords([])
    newPdf.setProducer("Skynet Media Optimizer")
    newPdf.setCreator("")
  }

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdfSource.getPage(i)

    // Get original page size in PDF points (72 DPI)
    const origViewport = page.getViewport({ scale: 1 })
    const pageW = origViewport.width
    const pageH = origViewport.height

    // Compute scale, clamping to max canvas dimensions
    let scale = dpi / 72
    const rawW = pageW * scale
    const rawH = pageH * scale
    if (rawW > MAX_CANVAS_DIM || rawH > MAX_CANVAS_DIM) {
      const clampScale = Math.min(MAX_CANVAS_DIM / rawW, MAX_CANVAS_DIM / rawH)
      scale *= clampScale
    }

    const viewport = page.getViewport({ scale })
    const canvasW = Math.floor(viewport.width)
    const canvasH = Math.floor(viewport.height)

    // Create a fresh canvas per page to avoid state leaks
    const canvas = document.createElement("canvas")
    canvas.width = canvasW
    canvas.height = canvasH
    const ctx = canvas.getContext("2d")!

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvasW, canvasH)

    // Render the full page
    // @ts-expect-error pdfjs-dist type mismatch with CanvasRenderingContext2D
    await page.render({ canvasContext: ctx, viewport }).promise

    // Convert canvas to JPEG
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), "image/jpeg", jpegQuality)
    })
    const jpegBytes = new Uint8Array(await blob.arrayBuffer())

    // Embed JPEG and add page at original PDF dimensions
    const jpegImage = await newPdf.embedJpg(jpegBytes)
    const newPage = newPdf.addPage([pageW, pageH])
    newPage.drawImage(jpegImage, {
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
    })

    // Release canvas memory
    canvas.width = 0
    canvas.height = 0

    // Cleanup pdfjs page
    page.cleanup()
  }

  pdfSource.destroy()

  const compressed = await newPdf.save({ useObjectStreams: true })
  return { buffer: compressed.buffer as ArrayBuffer, pageCount }
}

/** Check if a file is a PDF */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}
