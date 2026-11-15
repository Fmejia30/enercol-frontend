import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyNarrative, narrativeChanged, narrativeFrom } from './report-editor.ts'
import { reportPdfDocument } from './report-pdf.ts'
import { idleReportReview, type TechnicalReport, type TechnicalReportContent } from './technical-report.ts'

const content: TechnicalReportContent = {
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
  historicalAnalysis: null,
  interpretation: 'La observación queda separada de la causa.',
  hypotheses: [{ statement: 'Una hipótesis operativa.', basis: 'No está verificada.' }],
  financialImpact: { status: 'unavailable', narrative: 'El impacto financiero no está disponible.' },
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
}

describe('editor del informe', () => {
  it('edita el relato y conserva los valores deterministas', () => {
    const draft = narrativeFrom(content)
    draft.executiveSummary = 'Texto editado por el especialista.'
    draft.findingNarratives[0] = 'Explicación editada.'
    draft.historicalAnalysis = 'Este texto no debe reemplazar un histórico ausente.'
    const next = applyNarrative(content, draft)
    assert.equal(next.executiveSummary, draft.executiveSummary)
    assert.equal(next.technicalFindings[0]?.narrative, 'Explicación editada.')
    assert.equal(next.technicalFindings[0]?.measuredValue, '267.250')
    assert.equal(next.historicalAnalysis, null)
    assert.equal(next.evidence[0]?.value, '267.250')
    assert.equal(next.financialImpact.status, 'unavailable')
    assert.equal(narrativeChanged(content, draft), true)
    assert.equal(narrativeChanged(content, narrativeFrom(content)), false)
  })

  it('arma el PDF con el texto guardado y la marca de borrador', () => {
    const saved = {
      id: 'report-1',
      requestId: 'request-1',
      analysisId: 'analysis-1',
      version: 2,
      status: 'DRAFT',
      origin: 'MANUAL',
      schemaVersion: 1,
      content: { ...content, executiveSummary: 'Resumen guardado.' },
      generation: { model: 'gpt-6-luna', reasoningEffort: 'low', inputTokens: null, outputTokens: null },
      createdBy: { firstName: 'Carlos', lastName: 'Méndez' },
      createdAt: '2026-11-14T18:00:00.000Z',
      updatedAt: '2026-11-14T20:00:00.000Z',
      review: idleReportReview,
    } satisfies TechnicalReport
    const document = reportPdfDocument(saved, {
      customerName: 'Textiles del Altiplano S.A.S.',
      facilityName: 'Planta Fontibón',
      author: 'Carlos Méndez',
    })
    const serialized = JSON.stringify(document)
    assert.equal(document.pageSize, 'A4')
    assert.equal(document.defaultStyle.font, 'Lato')
    assert.match(serialized, /BORRADOR/)
    assert.match(serialized, /1\. Identificación/)
    assert.match(serialized, /14\. Conclusiones/)
    assert.match(serialized, /Resumen guardado/)
    assert.equal(serialized.includes('Texto todavía no guardado'), false)
    assert.match(serialized, /"alignment":"justify"/)
    assert.match(serialized, /14\/11\/2026/)
    assert.match(serialized, /03\/09\/2026/)
    assert.match(serialized, /01\/09\/2026/)
    assert.equal(serialized.includes('(Guatemala)'), false)
    assert.match(serialized, /267\.250 kW/)
    assert.match(serialized, /PV-A05-001/)
    assert.match(serialized, /Textiles del Altiplano/)
  })

  it('arma el PDF aprobado solo con la versión aprobada', () => {
    const saved = {
      id: 'report-1',
      requestId: 'request-1',
      analysisId: 'analysis-1',
      version: 3,
      status: 'APPROVED',
      origin: 'MANUAL',
      schemaVersion: 1,
      content,
      generation: { model: 'gpt-6-luna', reasoningEffort: 'low', inputTokens: null, outputTokens: null },
      createdBy: { firstName: 'Carlos', lastName: 'Méndez' },
      createdAt: '2026-11-14T18:00:00.000Z',
      updatedAt: '2026-11-15T16:00:00.000Z',
      review: {
        ...idleReportReview,
        approvedVersion: 3,
        approvedAt: '2026-11-15T16:00:00.000Z',
        approvedBy: { firstName: 'Laura', lastName: 'Pineda' },
      },
    } satisfies TechnicalReport
    assert.throws(
      () => reportPdfDocument({ ...saved, status: 'DRAFT' }, { customerName: 'Cliente', facilityName: 'Planta', author: 'Carlos Méndez' }, {
        version: 3,
        approvedAt: '2026-11-15T16:00:00.000Z',
        approver: 'Laura Pineda',
      }),
    )
    const document = reportPdfDocument(saved, {
      customerName: 'Textiles del Altiplano S.A.S.',
      facilityName: 'Planta Fontibón',
      author: 'Carlos Méndez',
    }, {
      version: 3,
      approvedAt: '2026-11-15T16:00:00.000Z',
      approver: 'Laura Pineda',
    })
    const serialized = JSON.stringify(document)
    assert.match(serialized, /APROBADO/)
    assert.match(serialized, /Laura Pineda/)
    assert.match(serialized, /15\/11\/2026/)
    assert.equal(serialized.includes('BORRADOR'), false)
    assert.equal(document.watermark, undefined)
    assert.match(serialized, /267\.250 kW/)
  })
})
