import { ApiError } from '../../shared/lib/api-error.ts'
import type { ReportPdfDocument } from './report-pdf.ts'

interface PdfMaker {
  addVirtualFileSystem: (fonts: Record<string, string>) => void
  addFonts: (fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>) => void
  createPdf: (document: ReportPdfDocument) => {
    download: (filename: string) => Promise<void>
  }
}

const fontFiles = {
  'Lato-Regular.ttf': '/fonts/Lato-Regular.ttf',
  'Lato-Bold.ttf': '/fonts/Lato-Bold.ttf',
  'Lato-Italic.ttf': '/fonts/Lato-Italic.ttf',
  'Lato-BoldItalic.ttf': '/fonts/Lato-BoldItalic.ttf',
} as const

let configured = false

export async function downloadReportPdf(document: ReportPdfDocument, filename: string) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default as PdfMaker
  if (!configured) {
    pdfMake.addVirtualFileSystem(await loadFonts())
    pdfMake.addFonts({
      Lato: {
        normal: 'Lato-Regular.ttf',
        bold: 'Lato-Bold.ttf',
        italics: 'Lato-Italic.ttf',
        bolditalics: 'Lato-BoldItalic.ttf',
      },
    })
    configured = true
  }
  await pdfMake.createPdf(document).download(filename)
}

async function loadFonts() {
  const entries = await Promise.all(
    Object.entries(fontFiles).map(async ([name, path]) => {
      const response = await fetch(path)
      if (!response.ok) throw new ApiError('No fue posible cargar la tipografía del informe.', null)
      return [name, bytesToBase64(new Uint8Array(await response.arrayBuffer()))] as const
    }),
  )
  return Object.fromEntries(entries)
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x4000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}
