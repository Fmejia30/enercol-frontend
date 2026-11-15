import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  analysisStatusLabel,
  datasetLines,
  evidenceLine,
  executedAtLabel,
  findingLines,
  historyLine,
  interpretationLabel,
  parseTechnicalAnalysis,
  telemetryLine,
  type TechnicalDataset,
} from './technical-analysis.ts'

const dataset: TechnicalDataset = {
  requestId: '6f1c2a10-4b7e-4a1d-9c31-a05000000002',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  demandThreshold: null,
  demandUnit: 'kW',
  evaluationConsumption: '124800.000',
  consumptionUnit: 'kWh',
  sourceName: 'Conjunto técnico controlado Act-05',
  sourceKind: 'local-controlled-dataset',
  telemetry: [],
  historicalConsumption: [
    { periodStart: '2026-08-01', periodEnd: '2026-08-31', consumption: '99500.750' },
  ],
}

describe('presentación del análisis técnico', () => {
  it('conserva las fechas del periodo y muestra los instantes en Guatemala', () => {
    assert.equal(datasetLines(dataset)[0], 'Periodo de evaluación: 01/09/2026 – 30/09/2026')
    assert.equal(datasetLines(dataset).at(-1), 'Consumo del periodo: 124800.000 kWh')
    assert.equal(
      historyLine(dataset.historicalConsumption[0]!, 'kWh'),
      '01/08/2026 – 31/08/2026 · 99500.750 kWh',
    )
    assert.equal(
      telemetryLine({ measuredAt: '2026-09-03T15:30:00.000Z', measuredDemand: '267.250' }, 'kW'),
      '03/09/2026 09:30 (Guatemala) · 267.250 kW',
    )
    assert.equal(executedAtLabel('2026-11-15T02:10:00.000Z'), '14/11/2026 20:10 (Guatemala)')
  })

  it('distingue una observación confirmada de una variación que no es una anomalía', () => {
    const finding = {
      findingType: 'CONSUMPTION_INCREASE',
      description: 'El consumo aumentó respecto del promedio.',
      measuredValue: '124800.000',
      referenceValue: '99583.583',
      difference: '25216.417',
      percentage: '25.322',
      unit: 'kWh',
      interpretation: 'requires-interpretation' as const,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      evidence: [
        {
          label: 'Consumo del periodo de evaluación',
          value: '124800.000',
          unit: 'kWh',
          measuredAt: null,
          periodStart: '2026-09-01',
          periodEnd: '2026-09-30',
        },
      ],
    }
    assert.equal(analysisStatusLabel('FAILED'), 'No completado')
    assert.equal(interpretationLabel('confirmed-observation'), 'Observación numérica confirmada con los datos almacenados.')
    assert.match(interpretationLabel(finding.interpretation), /No confirma una anomalía/)
    assert.deepEqual(findingLines(finding), [
      'Medido: 124800.000 kWh',
      'Referencia: 99583.583 kWh',
      'Diferencia: 25216.417 kWh',
      'Variación: 25.322 %',
      'Periodo: 01/09/2026 – 30/09/2026',
    ])
    assert.equal(
      evidenceLine(finding.evidence[0]!),
      'Consumo del periodo de evaluación: 124800.000 kWh · 01/09/2026 – 30/09/2026',
    )
  })

  it('rechaza un análisis cuyo cliente intenta fijar un formato distinto al calculado', () => {
    assert.throws(() =>
      parseTechnicalAnalysis({
        id: 'analysis-1',
        requestId: dataset.requestId,
        status: 'SUCCEEDED',
        executedAt: '2026-11-15T02:10:00.000Z',
        failureMessage: null,
        findings: [{ measuredValue: '1' }],
        inputSnapshot: { requestType: 'CONSUMO_ATIPICO', periodStart: '2026-09-01', periodEnd: '2026-09-30' },
      }),
    )
  })
})
