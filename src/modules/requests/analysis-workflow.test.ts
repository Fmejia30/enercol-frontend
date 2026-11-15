import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { analysisAction, datasetCurrency, reportAction } from './analysis-workflow.ts'
import type { TechnicalAnalysis, TechnicalDataset } from './technical-analysis.ts'
import type { TechnicalReport } from './technical-report.ts'

const dataset: TechnicalDataset = {
  requestId: 'request-1',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-07',
  demandThreshold: '250.000',
  demandUnit: 'kW',
  evaluationConsumption: null,
  consumptionUnit: 'kWh',
  sourceName: 'Conjunto técnico controlado Act-05',
  sourceKind: 'local-controlled-dataset',
  telemetry: [{ measuredAt: '2026-09-03T15:30:00.000Z', measuredDemand: '267.250' }],
  historicalConsumption: [],
}

const analysis: TechnicalAnalysis = {
  id: 'analysis-1',
  requestId: dataset.requestId,
  status: 'SUCCEEDED',
  executedAt: '2026-11-15T02:10:00.000Z',
  failureMessage: null,
  findings: [],
  inputSnapshot: {
    requestType: 'VERIFICACION_DEMANDA',
    periodStart: dataset.periodStart,
    periodEnd: dataset.periodEnd,
    demandThreshold: dataset.demandThreshold,
    evaluationConsumption: dataset.evaluationConsumption,
    telemetry: dataset.telemetry,
    historicalConsumption: dataset.historicalConsumption,
  },
}

const report = {
  id: 'report-1',
  analysisId: analysis.id,
  version: 1,
} as TechnicalReport

describe('análisis repetido', () => {
  it('oculta una nueva ejecución cuando el análisis exitoso corresponde a los datos actuales', () => {
    assert.equal(datasetCurrency(analysis, dataset), 'current')
    const action = analysisAction({ canExecute: true, dataset, analyses: [analysis] })
    assert.equal(action.kind, 'completed')
    assert.match(action.kind === 'completed' ? action.message : '', /ya fue completado/)
  })

  it('permite otra ejecución cuando los datos cambiaron y conserva el resultado anterior', () => {
    const changed = { ...dataset, demandThreshold: '240.000' }
    assert.equal(datasetCurrency(analysis, changed), 'outdated')
    const action = analysisAction({ canExecute: true, dataset: changed, analyses: [analysis] })
    assert.equal(action.kind, 'outdated')
  })

  it('ofrece un reintento controlado cuando la ejecución falló y no hay un éxito vigente', () => {
    const failed = { ...analysis, status: 'FAILED' as const, failureMessage: 'Datos incompletos' }
    const action = analysisAction({ canExecute: true, dataset, analyses: [failed] })
    assert.equal(action.kind, 'run')
    assert.equal(action.kind === 'run' ? action.label : '', 'Reintentar análisis')
  })
})

describe('generación del informe', () => {
  it('no ofrece otra generación cuando el análisis actual ya tiene borrador', () => {
    const action = reportAction({
      canCreate: true,
      dataset,
      analyses: [analysis],
      reports: [report],
    })
    assert.equal(action.kind, 'existing')
    assert.match(action.message, /No es necesario volver a generar/)
  })

  it('explica que falta un análisis exitoso', () => {
    const action = reportAction({ canCreate: true, dataset, analyses: [], reports: [] })
    assert.equal(action.kind, 'missing-analysis')
    assert.match(action.message, /todavía no existe un análisis exitoso/)
  })

  it('no deja generar al validador', () => {
    const action = reportAction({ canCreate: false, dataset, analyses: [analysis], reports: [] })
    assert.equal(action.kind, 'wait')
  })
})
