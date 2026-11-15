import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ApiError } from '../../shared/lib/api-error.ts'
import {
  generationSummary,
  idleReportReview,
  parseTechnicalReport,
  reportSections,
  reportStatusLabel,
  type TechnicalReport,
} from './technical-report.ts'

const report: TechnicalReport = {
  id: 'report-1',
  requestId: '6f1c2a10-4b7e-4a1d-9c31-a05000000001',
  analysisId: 'analysis-1',
  version: 1,
  status: 'DRAFT',
  origin: 'AI',
  schemaVersion: 1,
  content: {
    schemaVersion: 1,
    title: 'Borrador de verificación de demanda',
    identification: {
      ticketCode: 'PV-A05-001',
      requestType: 'VERIFICACION_DEMANDA',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
    },
    executiveSummary: 'La demanda máxima supera el umbral contractual.',
    background: 'La solicitud pide revisar la demanda del periodo.',
    scope: 'Se explica el análisis determinista.',
    technicalFindings: [
      {
        findingType: 'DEMAND_EXCEEDANCE',
        narrative: 'Se conserva la medición determinista.',
        measuredValue: '267.250',
        referenceValue: '250.000',
        difference: '17.250',
        percentage: '6.900',
        unit: 'kW',
        interpretation: 'confirmed-observation',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-07',
      },
    ],
    contractualComparison: 'La comparación usa el umbral almacenado.',
    historicalAnalysis: 'El histórico acompaña el caso.',
    interpretation: 'La observación queda separada de la causa.',
    hypotheses: [
      {
        statement: 'Una hipótesis es un cambio operativo no verificado.',
        basis: 'No hay evidencia de la causa.',
      },
    ],
    financialImpact: {
      status: 'unavailable',
      narrative: 'No hay tarifas ni costos. El impacto financiero no está disponible.',
    },
    recommendations: [{ text: 'Validar la lectura en sitio.' }],
    evidence: [
      {
        label: 'Lectura de demanda',
        value: '267.250',
        unit: 'kW',
        measuredAt: '2026-09-03T15:30:00.000Z',
        periodStart: null,
        periodEnd: null,
      },
    ],
    limitations: ['Faltan datos financieros.'],
    conclusions: 'El borrador conserva los valores deterministas.',
    draftStatus: 'DRAFT',
  },
  generation: {
    model: 'gpt-6-luna',
    reasoningEffort: 'low',
    inputTokens: 321,
    outputTokens: 654,
  },
  createdBy: { firstName: 'Carlos', lastName: 'Méndez' },
  createdAt: '2026-11-14T18:00:00.000Z',
  updatedAt: '2026-11-14T18:00:00.000Z',
  review: idleReportReview,
}

describe('technical report view', () => {
  it('shows the draft, its measurements, and a hypothesis separate from the finding', () => {
    const parsed = parseTechnicalReport(report)
    const sections = reportSections(parsed)
    const findings = sections.find((section) => section.heading === 'Hallazgos técnicos')
    const hypotheses = sections.find((section) => section.heading === 'Hipótesis, no causa verificada')
    const financial = sections.find((section) => section.heading === 'Impacto financiero')

    assert.equal(reportStatusLabel(parsed.status), 'Borrador')
    assert.match(generationSummary(parsed), /gpt-6-luna/)
    assert.match(generationSummary(parsed), /Entrada 321 tokens, salida 654 tokens/)
    assert.match(generationSummary(parsed), /Carlos Méndez/)
    assert.match(generationSummary(parsed), /Guatemala/)
    assert.match(findings?.paragraphs.join(' ') ?? '', /267\.250 kW/)
    assert.match(hypotheses?.paragraphs.join(' ') ?? '', /hipótesis/i)
    assert.equal(hypotheses?.paragraphs.some((paragraph) => paragraph.includes('267.250')), false)
    assert.match(financial?.paragraphs.join(' ') ?? '', /no está disponible/)
  })

  it('rejects a report that invents a financial status', () => {
    assert.throws(
      () =>
        parseTechnicalReport({
          ...report,
          content: {
            ...report.content,
            financialImpact: { status: 'described', narrative: 'Ahorro de Q 1500.' },
          },
        }),
      ApiError,
    )
  })
})
