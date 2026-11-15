interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_NAME?: string
}

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    addVirtualFileSystem: (fonts: Record<string, string>) => void
    addFonts: (fonts: Record<string, { normal: string; bold: string; italics: string; bolditalics: string }>) => void
    createPdf: (document: unknown) => { download: (filename: string) => Promise<void> }
  }
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const fonts: Record<string, string>
  export default fonts
}
