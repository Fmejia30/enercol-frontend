import { formatPdfDate } from '../../shared/lib/date-time.ts'
import { typeLabel } from './request-list.ts'
import { interpretationLabel } from './technical-analysis.ts'
import { type TechnicalReport } from './technical-report.ts'

export interface ReportPdfContext {
  customerName: string
  facilityName: string
  author: string
}

interface PdfNode {
  text?: string
  style?: string
  margin?: number[]
  pageBreak?: 'before'
  bold?: boolean
  italics?: boolean
  fontSize?: number
  color?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  fillColor?: string
  width?: string | number
  stack?: PdfNode[]
  columns?: PdfNode[]
  unbreakable?: boolean
  svg?: string
  canvas?: Array<Record<string, string | number>>
  table?: {
    headerRows?: number
    dontBreakRows?: boolean
    widths: Array<string | number>
    body: PdfNode[][]
  }
  layout?: 'noBorders' | PdfTableLayout
}

interface PdfTableLayout {
  hLineWidth: (index: number, node: { table: { body: unknown[] } }) => number
  vLineWidth: () => number
  hLineColor: () => string
  fillColor: (row: number) => string | null
  paddingLeft: () => number
  paddingRight: () => number
  paddingTop: () => number
  paddingBottom: () => number
}

export interface ReportPdfApproval {
  version: number
  approvedAt: string
  approver: string
}

export interface ReportPdfDocument {
  info: { title: string; author: string; subject: string }
  pageSize: 'A4'
  pageMargins: [number, number, number, number]
  defaultStyle: { font: string; fontSize: number; lineHeight: number; color: string }
  styles: Record<string, { fontSize?: number; bold?: boolean; color?: string; margin?: number[] }>
  header: (currentPage: number) => PdfNode
  footer: (currentPage: number, pageCount: number) => PdfNode
  content: PdfNode[]
  watermark?: { text: string; color: string; opacity: number; bold: boolean; italics: boolean }
}

const NAVY = '#172B4D'
const TEAL = '#087E8B'
const TEXT = '#344054'
const MUTED = '#667085'
const LINE = '#DCE5EC'
const CONTENT_WIDTH = 499

const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <rect x="1.25" y="1.25" width="33.5" height="33.5" rx="7" fill="none" stroke="${NAVY}" stroke-width="1.5"/>
  <path d="M12.5 8.5v19" fill="none" stroke="${NAVY}" stroke-width="1.75"/>
  <path d="M12.5 13h8" fill="none" stroke="${NAVY}" stroke-width="1.75"/>
  <path d="M12.5 18h11" fill="none" stroke="${TEAL}" stroke-width="1.75"/>
  <path d="M12.5 23h6.5" fill="none" stroke="${NAVY}" stroke-width="1.75"/>
  <circle cx="24.75" cy="18" r="1.65" fill="${TEAL}"/>
</svg>`

export function reportPdfDocument(
  report: TechnicalReport,
  context: ReportPdfContext,
  approval: ReportPdfApproval | null = null,
): ReportPdfDocument {
  if ((report.status === 'APPROVED') !== (approval !== null) || (approval !== null && approval.version !== report.version)) {
    throw new Error('El PDF final solo puede generarse desde la versión aprobada.')
  }
  const mark = approval ? 'APROBADO' : 'BORRADOR'
  const content = report.content
  const period = `${formatPdfDate(content.identification.periodStart)} – ${formatPdfDate(content.identification.periodEnd)}`
  const ticket = content.identification.ticketCode
  const blocks: PdfNode[] = [
    cover(report, context, period, mark, approval),
    section('1', 'Identificación', identificationText(report, context, period, mark), true, false),
    section('2', 'Resumen ejecutivo', content.executiveSummary),
    section('3', 'Antecedentes', content.background),
    section('4', 'Alcance', content.scope),
    findings(content.technicalFindings),
    section('6', 'Comparación contractual', content.contractualComparison),
    section('7', 'Análisis histórico', content.historicalAnalysis ?? 'No hay información histórica disponible.'),
    section('8', 'Interpretación', content.interpretation),
    hypotheses(content.hypotheses),
    section(
      '10',
      'Impacto financiero',
      `${content.financialImpact.narrative}\n\nEl importe no está calculado.`,
    ),
    recommendations(content.recommendations),
    evidence(content.evidence),
    limitations(content.limitations),
    section('14', 'Conclusiones', content.conclusions),
    ...(approval
      ? []
      : [
          {
            text: 'Este documento es un borrador. No ha sido aprobado ni emitido.',
            fontSize: 8,
            color: MUTED,
            margin: [0, 18, 0, 0],
          } satisfies PdfNode,
        ]),
    {
      text: `${typeLabel(content.identification.requestType)} · Versión ${report.version} · ${mark}`,
      fontSize: 8,
      color: MUTED,
      margin: [0, 4, 0, 0],
    },
  ]

  return {
    info: {
      title: `${ticket} · ${content.title}`,
      author: context.author,
      subject: approval
        ? `APROBADO. Versión ${approval.version}.`
        : 'BORRADOR. Este documento no está aprobado ni emitido.',
    },
    pageSize: 'A4',
    pageMargins: [48, 64, 48, 56],
    defaultStyle: { font: 'Lato', fontSize: 10, lineHeight: 1.35, color: TEXT },
    styles: {
      coverTitle: { fontSize: 22, bold: true, color: NAVY, margin: [0, 28, 0, 0] },
      coverSubtitle: { fontSize: 12, color: MUTED, margin: [0, 8, 0, 0] },
      heading: { fontSize: 13, bold: true, color: NAVY, margin: [0, 16, 0, 6] },
    },
    ...(approval ? {} : { watermark: { text: 'BORRADOR', color: NAVY, opacity: 0.07, bold: true, italics: false } }),
    header: (currentPage) => (currentPage === 1 ? { text: '' } : runningHeader(ticket, report.version, mark)),
    footer: (currentPage, pageCount) => ({
      margin: [48, 16, 48, 0],
      columns: [
        { text: mark, bold: true, fontSize: 8, color: TEAL, width: 'auto' },
        { text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: MUTED, alignment: 'right' },
      ],
    }),
    content: blocks,
  }
}

function cover(
  report: TechnicalReport,
  context: ReportPdfContext,
  period: string,
  mark: string,
  approval: ReportPdfApproval | null,
): PdfNode {
  const content = report.content
  return {
    stack: [
      { canvas: [{ type: 'rect', x: 0, y: 0, w: CONTENT_WIDTH, h: 4, color: NAVY }] },
      {
        margin: [0, 28, 0, 0],
        columns: [
          { svg: LOGO, width: 36 },
          { text: 'EnerCol', bold: true, fontSize: 16, color: NAVY, margin: [12, 8, 0, 0], width: '*' },
        ],
      },
      {
        table: {
          widths: ['auto'],
          body: [[
            { text: mark, color: '#FFFFFF', fillColor: TEAL, bold: true, fontSize: 9, margin: [8, 3, 8, 3] },
          ]],
        },
        layout: 'noBorders',
        margin: [0, 28, 0, 0],
      },
      { text: 'Informe técnico', style: 'coverTitle' },
      { text: content.title, style: 'coverSubtitle' },
      {
        margin: [0, 28, 0, 0],
        table: {
          headerRows: 0,
          dontBreakRows: true,
          widths: [140, '*'],
          body: [
            meta('Informe', report.id),
            meta('Solicitud', content.identification.ticketCode),
            meta('Cliente', context.customerName),
            meta('Instalación', context.facilityName),
            meta('Periodo de evaluación', period),
            meta('Autor', context.author),
            meta('Versión', String(report.version)),
            meta('Estado', mark),
            ...(approval
              ? [meta('Aprobación', formatPdfDate(approval.approvedAt)), meta('Aprobó', approval.approver)]
              : []),
            meta('Actualización', formatPdfDate(report.updatedAt)),
          ],
        },
        layout: rules(false),
      },
    ],
  }
}

function identificationText(report: TechnicalReport, context: ReportPdfContext, period: string, mark: string) {
  const content = report.content
  return [
    `Informe: ${report.id}`,
    `Solicitud: ${content.identification.ticketCode}`,
    `Cliente: ${context.customerName}`,
    `Instalación: ${context.facilityName}`,
    `Periodo de evaluación: ${period}`,
    `Tipo: ${typeLabel(content.identification.requestType)}`,
    `Autor: ${context.author}`,
    `Versión: ${report.version}`,
    `Estado: ${mark}`,
  ].join('\n')
}

function section(number: string, title: string, body: string, pageBreak = false, justify = true): PdfNode {
  const block: PdfNode = {
    stack: [
      { text: `${number}. ${title}`, style: 'heading' },
      justify ? paragraph(body) : { text: body, margin: [0, 0, 0, 4] },
    ],
  }
  if (pageBreak) block.pageBreak = 'before'
  if (body.length < 500) block.unbreakable = true
  return block
}

function findings(items: TechnicalReport['content']['technicalFindings']): PdfNode {
  const stack: PdfNode[] = [{ text: '5. Hallazgos técnicos', style: 'heading' }]
  if (items.length === 0) {
    stack.push({ text: 'No hay hallazgos registrados.', margin: [0, 0, 0, 8] })
    return { stack }
  }
  for (const finding of items) {
    stack.push(paragraph(finding.narrative, [0, 0, 0, 6]))
    stack.push({
      text: interpretationLabel(finding.interpretation),
      fontSize: 9,
      italics: true,
      color: MUTED,
      margin: [0, 0, 0, 6],
    })
    stack.push(dataTable(
      [head('Concepto'), head('Medido', 'right'), head('Referencia', 'right'), head('Diferencia', 'right'), head('Variación', 'right')],
      [[
        value('Valor registrado'),
        value(`${finding.measuredValue} ${finding.unit}`, 'right'),
        value(`${finding.referenceValue} ${finding.unit}`, 'right'),
        value(`${finding.difference} ${finding.unit}`, 'right'),
        value(`${finding.percentage} %`, 'right'),
      ]],
      ['*', 78, 78, 78, 62],
    ))
  }
  return { stack }
}

function hypotheses(items: TechnicalReport['content']['hypotheses']): PdfNode {
  const stack: PdfNode[] = [
    { text: '9. Hipótesis de causa', style: 'heading' },
    { text: 'Estas hipótesis no son una causa verificada.', italics: true, color: MUTED, margin: [0, 0, 0, 6] },
  ]
  if (items.length === 0) {
    stack.push({ text: 'No hay hipótesis registradas.', margin: [0, 0, 0, 8] })
  }
  for (const hypothesis of items) {
    stack.push({ text: hypothesis.statement, bold: true, alignment: 'justify', margin: [0, 4, 0, 2] })
    stack.push(paragraph(hypothesis.basis, [0, 0, 0, 8]))
  }
  return { stack }
}

function recommendations(items: TechnicalReport['content']['recommendations']): PdfNode {
  const stack: PdfNode[] = [{ text: '11. Recomendaciones preliminares', style: 'heading' }]
  if (items.length === 0) {
    stack.push({ text: 'No hay recomendaciones registradas.', margin: [0, 0, 0, 8] })
  }
  for (const recommendation of items) {
    stack.push(paragraph(recommendation.text, [0, 0, 0, 6]))
  }
  return { stack }
}

function evidence(items: TechnicalReport['content']['evidence']): PdfNode {
  const stack: PdfNode[] = [{ text: '12. Evidencias', style: 'heading' }]
  if (items.length === 0) {
    stack.push({ text: 'No hay evidencias registradas.', margin: [0, 0, 0, 8] })
    return { stack }
  }
  stack.push(dataTable(
    [head('Evidencia'), head('Valor', 'right'), head('Unidad'), head('Momento')],
    items.map((item) => [
      value(item.label),
      value(item.value, 'right'),
      value(item.unit),
      value(evidenceWhen(item)),
    ]),
    ['*', 72, 52, '*'],
  ))
  return { stack }
}

function limitations(items: string[]): PdfNode {
  const stack: PdfNode[] = [{ text: '13. Limitaciones', style: 'heading' }]
  if (items.length === 0) {
    stack.push({ text: 'No hay limitaciones registradas.', margin: [0, 0, 0, 8] })
  }
  for (const limitation of items) {
    stack.push(paragraph(limitation, [0, 0, 0, 6]))
  }
  return { stack }
}

function runningHeader(ticket: string, version: number, mark: string): PdfNode {
  return {
    margin: [48, 28, 48, 0],
    columns: [
      { text: 'EnerCol', bold: true, fontSize: 8, color: NAVY, width: 'auto' },
      { text: `${ticket}  ·  Versión ${version}  ·  ${mark}`, fontSize: 8, color: MUTED, alignment: 'right' },
    ],
  }
}

function meta(label: string, value: string): PdfNode[] {
  return [
    { text: label, color: MUTED, fontSize: 9, margin: [0, 4, 12, 4] },
    { text: value, color: TEXT, fontSize: 10, margin: [0, 4, 0, 4] },
  ]
}

function head(text: string, alignment: 'left' | 'right' = 'left'): PdfNode {
  return { text, bold: true, color: NAVY, fontSize: 8, alignment }
}

function value(text: string, alignment: 'left' | 'right' = 'left'): PdfNode {
  return { text, color: TEXT, fontSize: 9, alignment }
}

function dataTable(headers: PdfNode[], rows: PdfNode[][], widths: Array<string | number>): PdfNode {
  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths,
      body: [headers, ...rows],
    },
    layout: rules(true),
    margin: [0, 2, 0, 12],
  }
}

function rules(headerFill: boolean): PdfTableLayout {
  return {
    hLineWidth: (index, node) => (index === 0 || index === 1 || index === node.table.body.length ? 0.6 : 0.25),
    vLineWidth: () => 0,
    hLineColor: () => LINE,
    fillColor: (row) => (headerFill && row === 0 ? '#F5F7FA' : null),
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 5,
    paddingBottom: () => 5,
  }
}

function paragraph(text: string, margin: number[] = [0, 0, 0, 4]): PdfNode {
  return { text, alignment: 'justify', margin }
}

function evidenceWhen(item: TechnicalReport['content']['evidence'][number]) {
  if (item.measuredAt) return formatPdfDate(item.measuredAt)
  if (item.periodStart && item.periodEnd) {
    return `${formatPdfDate(item.periodStart)} – ${formatPdfDate(item.periodEnd)}`
  }
  return 'Sin marca de tiempo'
}
