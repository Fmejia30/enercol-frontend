import { z } from 'zod'
import { ApiError } from '../../shared/lib/api-error.ts'
import { formatCalendarDate, formatInstant } from '../../shared/lib/date-time.ts'
import { interpretationLabel } from './technical-analysis.ts'

const text = z.string().min(1)
const nullableText = z.string().nullable()

const findingSchema = z.object({
  findingType: text,
  narrative: text,
  measuredValue: z.string(),
  referenceValue: z.string(),
  difference: z.string(),
  percentage: z.string(),
  unit: text,
  interpretation: z.enum(['confirmed-observation', 'requires-interpretation']),
  periodStart: z.string(),
  periodEnd: z.string(),
})

const evidenceSchema = z.object({
  label: text,
  value: z.string(),
  unit: text,
  measuredAt: nullableText,
  periodStart: nullableText,
  periodEnd: nullableText,
})

const contentSchema = z.object({
  schemaVersion: z.literal(1),
  title: text,
  identification: z.object({
    ticketCode: text,
    requestType: text,
    periodStart: z.string(),
    periodEnd: z.string(),
  }),
  executiveSummary: text,
  background: text,
  scope: text,
  technicalFindings: z.array(findingSchema),
  contractualComparison: text,
  historicalAnalysis: nullableText,
  interpretation: text,
  hypotheses: z.array(z.object({ statement: text, basis: text })),
  financialImpact: z.object({
    status: z.literal('unavailable'),
    narrative: text,
  }),
  recommendations: z.array(z.object({ text })),
  evidence: z.array(evidenceSchema),
  limitations: z.array(text),
  conclusions: text,
  draftStatus: z.literal('DRAFT'),
})

const personSchema = z.object({ firstName: text, lastName: text })

export const reportStatuses = [
  'DRAFT',
  'PENDING_VALIDATION',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'REANALYSIS_REQUIRED',
  'APPROVED',
] as const

const reviewSchema = z.object({
  submittedVersion: z.number().int().positive().nullable(),
  submittedAt: z.string().datetime().nullable(),
  submittedBy: personSchema.nullable(),
  approvedVersion: z.number().int().positive().nullable(),
  approvedAt: z.string().datetime().nullable(),
  approvedBy: personSchema.nullable(),
  decision: z
    .object({
      type: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'REANALYSIS_REQUIRED']),
      version: z.number().int().positive(),
      comments: z.string().nullable(),
      at: z.string().datetime(),
      by: personSchema.nullable(),
    })
    .nullable(),
  canSubmit: z.boolean(),
  canStartReview: z.boolean(),
  canDecide: z.boolean(),
})

const reportSchema = z.object({
  id: text,
  requestId: text,
  analysisId: text,
  version: z.number().int().positive(),
  status: z.enum(reportStatuses),
  origin: z.enum(['AI', 'MANUAL']),
  schemaVersion: z.literal(1),
  content: contentSchema,
  generation: z.object({
    model: text,
    reasoningEffort: text,
    inputTokens: z.number().int().nonnegative().nullable(),
    outputTokens: z.number().int().nonnegative().nullable(),
  }),
  createdBy: personSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  review: reviewSchema,
})

const reportListSchema = z.object({
  items: z.array(reportSchema),
})

const reportCatalogSchema = z.object({
  items: z.array(
    z.object({
      ticketCode: text,
      customerName: text,
      facilityName: text,
      requestType: text,
      report: reportSchema,
    }),
  ),
})

const reviewEventSchema = z.object({
  id: text,
  reportId: text,
  version: z.number().int().positive(),
  type: z.enum(['SUBMITTED', 'REVIEW_STARTED', 'APPROVED', 'CHANGES_REQUESTED', 'REANALYSIS_REQUIRED']),
  comments: z.string().nullable(),
  at: z.string().datetime(),
  by: personSchema.nullable(),
})

const pendingReportSchema = z.object({
  requestId: text,
  reportId: text,
  ticketCode: text,
  customerName: text,
  facilityName: text,
  title: text,
  version: z.number().int().positive(),
  status: z.enum(['PENDING_VALIDATION', 'UNDER_REVIEW']),
  submittedAt: z.string().datetime().nullable(),
  submittedBy: personSchema.nullable(),
})

const pendingPageSchema = z.object({
  items: z.array(pendingReportSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

const reviewPacketSchema = z.object({
  request: z.object({
    ticketCode: text,
    customerName: text,
    facilityName: text,
  }),
  reports: z.array(reportSchema),
  reviews: z.array(reviewEventSchema),
})

const approvedDocumentSchema = z.object({
  report: reportSchema,
  approval: z.object({
    version: z.number().int().positive(),
    approvedAt: z.string().datetime(),
    approver: personSchema.nullable(),
  }),
})

export type TechnicalReport = z.infer<typeof reportSchema>
export type TechnicalReportContent = TechnicalReport['content']
export type TechnicalReportCatalogItem = z.infer<typeof reportCatalogSchema>['items'][number]
export type TechnicalReportReviewEvent = z.infer<typeof reviewEventSchema>
export type PendingTechnicalReport = z.infer<typeof pendingReportSchema>
export type PendingTechnicalReportPage = z.infer<typeof pendingPageSchema>
export type TechnicalReportReviewPacket = z.infer<typeof reviewPacketSchema>
export type ApprovedTechnicalReport = z.infer<typeof approvedDocumentSchema>

export const idleReportReview: TechnicalReport['review'] = {
  submittedVersion: null,
  submittedAt: null,
  submittedBy: null,
  approvedVersion: null,
  approvedAt: null,
  approvedBy: null,
  decision: null,
  canSubmit: false,
  canStartReview: false,
  canDecide: false,
}

export interface ReportSection {
  heading: string
  paragraphs: string[]
}

export function parseTechnicalReport(data: unknown): TechnicalReport {
  return parse(reportSchema, data)
}

export function parseTechnicalReports(data: unknown): TechnicalReport[] {
  return parse(reportListSchema, data).items
}

export function parseTechnicalReportCatalog(data: unknown): TechnicalReportCatalogItem[] {
  return parse(reportCatalogSchema, data).items
}

export function parseTechnicalReportReviews(data: unknown): TechnicalReportReviewEvent[] {
  return parse(z.object({ items: z.array(reviewEventSchema) }), data).items
}

export function parsePendingTechnicalReports(data: unknown): PendingTechnicalReportPage {
  return parse(pendingPageSchema, data)
}

export function parseTechnicalReportReviewPacket(data: unknown): TechnicalReportReviewPacket {
  return parse(reviewPacketSchema, data)
}

export function parseApprovedTechnicalReport(data: unknown): ApprovedTechnicalReport {
  return parse(approvedDocumentSchema, data)
}

const reportStatusLabels: Record<TechnicalReport['status'], string> = {
  DRAFT: 'Borrador',
  PENDING_VALIDATION: 'Pendiente de validación',
  UNDER_REVIEW: 'En revisión',
  CHANGES_REQUESTED: 'Cambios solicitados',
  REANALYSIS_REQUIRED: 'Requiere nuevo análisis',
  APPROVED: 'Informe aprobado',
}

export function reportStatusLabel(status: TechnicalReport['status']) {
  return reportStatusLabels[status]
}

export function reportStatusTone(status: TechnicalReport['status']) {
  if (status === 'APPROVED') return 'success' as const
  if (status === 'CHANGES_REQUESTED' || status === 'REANALYSIS_REQUIRED') return 'warning' as const
  if (status === 'PENDING_VALIDATION' || status === 'UNDER_REVIEW') return 'info' as const
  return 'draft' as const
}

export function reviewEventLabel(type: TechnicalReportReviewEvent['type']) {
  if (type === 'SUBMITTED') return 'Enviado a validación'
  if (type === 'REVIEW_STARTED') return 'Revisión iniciada'
  if (type === 'APPROVED') return 'Informe aprobado'
  if (type === 'CHANGES_REQUESTED') return 'Ajustes solicitados'
  return 'Reanálisis requerido'
}

export function reportOriginLabel(origin: TechnicalReport['origin']) {
  return origin === 'AI' ? 'Generado con IA' : 'Edición manual'
}

export function generationSummary(report: TechnicalReport) {
  const tokens =
    report.generation.inputTokens !== null && report.generation.outputTokens !== null
      ? `Entrada ${report.generation.inputTokens} tokens, salida ${report.generation.outputTokens} tokens`
      : 'Uso de tokens no informado'
  const author = report.createdBy
    ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
    : 'Autor no disponible'
  return `${reportStatusLabel(report.status)} · ${reportOriginLabel(report.origin)} · Versión ${report.version} · ${report.generation.model} · ${author} · ${formatInstant(report.createdAt)} · ${tokens}`
}

export function reportSections(report: TechnicalReport): ReportSection[] {
  const content = report.content
  return [
    { heading: 'Resumen ejecutivo', paragraphs: [content.executiveSummary] },
    { heading: 'Antecedentes', paragraphs: [content.background] },
    { heading: 'Alcance', paragraphs: [content.scope] },
    {
      heading: 'Hallazgos técnicos',
      paragraphs: content.technicalFindings.flatMap((finding) => [
        finding.narrative,
        `Medido ${finding.measuredValue} ${finding.unit}. Referencia ${finding.referenceValue} ${finding.unit}. Diferencia ${finding.difference} ${finding.unit} (${finding.percentage} %).`,
        interpretationLabel(finding.interpretation),
      ]),
    },
    { heading: 'Comparación contractual', paragraphs: [content.contractualComparison] },
    {
      heading: 'Análisis histórico',
      paragraphs: [content.historicalAnalysis ?? 'No hay información histórica disponible.'],
    },
    { heading: 'Interpretación', paragraphs: [content.interpretation] },
    {
      heading: 'Hipótesis, no causa verificada',
      paragraphs:
        content.hypotheses.length > 0
          ? content.hypotheses.map((item) => `${item.statement} ${item.basis}`)
          : ['No hay hipótesis registradas.'],
    },
    { heading: 'Impacto financiero', paragraphs: [content.financialImpact.narrative] },
    {
      heading: 'Recomendaciones preliminares',
      paragraphs: content.recommendations.map((item) => item.text),
    },
    {
      heading: 'Evidencia',
      paragraphs: content.evidence.map((item) => evidenceLine(item)),
    },
    { heading: 'Limitaciones', paragraphs: [...content.limitations] },
    { heading: 'Conclusiones', paragraphs: [content.conclusions] },
  ]
}

function evidenceLine(item: TechnicalReport['content']['evidence'][number]) {
  const when = item.measuredAt
    ? formatInstant(item.measuredAt)
    : item.periodStart && item.periodEnd
      ? `${formatCalendarDate(item.periodStart)} – ${formatCalendarDate(item.periodEnd)}`
      : 'sin marca de tiempo'
  return `${item.label}: ${item.value} ${item.unit} (${when})`
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.', null)
  }
  return result.data
}
