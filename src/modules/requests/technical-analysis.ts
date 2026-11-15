import { z } from 'zod'
import { ApiError } from '../../shared/lib/api-error.ts'
import { formatCalendarDate, formatInstant } from '../../shared/lib/date-time.ts'

const quantity = z.string().regex(/^-?(?:0|[1-9]\d*)\.\d{3}$/)
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const datasetSchema = z.object({
  requestId: z.string().min(1),
  periodStart: dateOnly,
  periodEnd: dateOnly,
  demandThreshold: quantity.nullable(),
  demandUnit: z.string().min(1),
  evaluationConsumption: quantity.nullable(),
  consumptionUnit: z.string().min(1),
  sourceName: z.string().min(1),
  sourceKind: z.string().min(1),
  telemetry: z.array(
    z.object({
      measuredAt: z.string().min(1),
      measuredDemand: quantity,
    }),
  ),
  historicalConsumption: z.array(
    z.object({
      periodStart: dateOnly,
      periodEnd: dateOnly,
      consumption: quantity,
    }),
  ),
})

const evidenceSchema = z.object({
  label: z.string().min(1),
  value: quantity,
  unit: z.string().min(1),
  measuredAt: z.string().min(1).nullable(),
  periodStart: dateOnly.nullable(),
  periodEnd: dateOnly.nullable(),
})

const findingSchema = z.object({
  findingType: z.string().min(1),
  description: z.string().min(1),
  measuredValue: quantity,
  referenceValue: quantity,
  difference: quantity,
  percentage: quantity,
  unit: z.string().min(1),
  interpretation: z.enum(['confirmed-observation', 'requires-interpretation']),
  periodStart: dateOnly,
  periodEnd: dateOnly,
  evidence: z.array(evidenceSchema),
})

const analysisSchema = z.object({
  id: z.string().min(1),
  requestId: z.string().min(1),
  status: z.enum(['SUCCEEDED', 'FAILED']),
  executedAt: z.string().min(1),
  failureMessage: z.string().nullable(),
  findings: z.array(findingSchema),
  inputSnapshot: z.object({
    requestType: z.string().min(1),
    periodStart: dateOnly,
    periodEnd: dateOnly,
    demandThreshold: quantity.nullable().optional(),
    demandUnit: z.string().min(1).optional(),
    evaluationConsumption: quantity.nullable().optional(),
    consumptionUnit: z.string().min(1).optional(),
    telemetry: z
      .array(z.object({ measuredAt: z.string().min(1), measuredDemand: quantity }))
      .optional(),
    historicalConsumption: z
      .array(
        z.object({
          periodStart: dateOnly,
          periodEnd: dateOnly,
          consumption: quantity,
        }),
      )
      .optional(),
  }),
})

const analysisListSchema = z.object({
  items: z.array(analysisSchema),
})

const analysisCatalogSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      requestId: z.string().min(1),
      ticketCode: z.string().min(1),
      customerName: z.string().min(1),
      facilityName: z.string().min(1),
      requestType: z.string().min(1),
      status: z.enum(['SUCCEEDED', 'FAILED']),
      executedAt: z.string().min(1),
      failureMessage: z.string().nullable(),
      findings: z.array(findingSchema),
    }),
  ),
})

export type TechnicalDataset = z.infer<typeof datasetSchema>
export type TechnicalAnalysis = z.infer<typeof analysisSchema>
export type AnalysisFinding = z.infer<typeof findingSchema>
export type TechnicalAnalysisCatalogItem = z.infer<typeof analysisCatalogSchema>['items'][number]

export function parseTechnicalDataset(data: unknown): TechnicalDataset {
  return parse(datasetSchema, data)
}

export function parseTechnicalAnalyses(data: unknown): TechnicalAnalysis[] {
  return parse(analysisListSchema, data).items
}

export function parseTechnicalAnalysisCatalog(data: unknown): TechnicalAnalysisCatalogItem[] {
  return parse(analysisCatalogSchema, data).items
}

export function parseTechnicalAnalysis(data: unknown): TechnicalAnalysis {
  return parse(analysisSchema, data)
}

export function datasetLines(dataset: TechnicalDataset): string[] {
  const lines = [
    `Periodo de evaluación: ${formatCalendarDate(dataset.periodStart)} – ${formatCalendarDate(dataset.periodEnd)}`,
    `Unidad de demanda: ${dataset.demandUnit}`,
    `Unidad de consumo: ${dataset.consumptionUnit}`,
  ]
  if (dataset.demandThreshold) {
    lines.push(`Umbral contractual de demanda: ${dataset.demandThreshold} ${dataset.demandUnit}`)
  }
  if (dataset.evaluationConsumption) {
    lines.push(`Consumo del periodo: ${dataset.evaluationConsumption} ${dataset.consumptionUnit}`)
  }
  return lines
}

export function telemetryLine(reading: TechnicalDataset['telemetry'][number], unit: string) {
  return `${formatInstant(reading.measuredAt)} · ${reading.measuredDemand} ${unit}`
}

export function historyLine(row: TechnicalDataset['historicalConsumption'][number], unit: string) {
  return `${formatCalendarDate(row.periodStart)} – ${formatCalendarDate(row.periodEnd)} · ${row.consumption} ${unit}`
}

export function analysisStatusLabel(status: TechnicalAnalysis['status']) {
  return status === 'SUCCEEDED' ? 'Completado' : 'No completado'
}

export function interpretationLabel(interpretation: AnalysisFinding['interpretation']) {
  return interpretation === 'confirmed-observation'
    ? 'Observación numérica confirmada con los datos almacenados.'
    : 'Observación numérica. No confirma una anomalía técnica.'
}

export function findingLines(finding: AnalysisFinding): string[] {
  return [
    `Medido: ${finding.measuredValue} ${finding.unit}`,
    `Referencia: ${finding.referenceValue} ${finding.unit}`,
    `Diferencia: ${finding.difference} ${finding.unit}`,
    `Variación: ${finding.percentage} %`,
    `Periodo: ${formatCalendarDate(finding.periodStart)} – ${formatCalendarDate(finding.periodEnd)}`,
  ]
}

export function evidenceLine(evidence: AnalysisFinding['evidence'][number]) {
  if (evidence.measuredAt) {
    return `${evidence.label}: ${evidence.value} ${evidence.unit} · ${formatInstant(evidence.measuredAt)}`
  }
  if (evidence.periodStart && evidence.periodEnd) {
    return `${evidence.label}: ${evidence.value} ${evidence.unit} · ${formatCalendarDate(evidence.periodStart)} – ${formatCalendarDate(evidence.periodEnd)}`
  }
  return `${evidence.label}: ${evidence.value} ${evidence.unit}`
}

export function executedAtLabel(value: string) {
  return formatInstant(value)
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.', null)
  }
  return result.data
}
