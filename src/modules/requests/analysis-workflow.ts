import type { TechnicalAnalysis, TechnicalDataset } from './technical-analysis.ts'
import type { TechnicalReport } from './technical-report.ts'

export type DatasetCurrency = 'current' | 'outdated' | 'unknown'

export function latestSuccessfulAnalysis(analyses: readonly TechnicalAnalysis[]) {
  return analyses.find((analysis) => analysis.status === 'SUCCEEDED') ?? null
}

export function datasetCurrency(
  analysis: TechnicalAnalysis | null,
  dataset: TechnicalDataset | null,
): DatasetCurrency {
  if (!analysis || !dataset) return 'unknown'
  const snapshot = analysis.inputSnapshot
  if (
    snapshot.telemetry === undefined ||
    snapshot.historicalConsumption === undefined ||
    snapshot.demandThreshold === undefined ||
    snapshot.evaluationConsumption === undefined
  ) {
    return 'unknown'
  }
  const same =
    snapshot.periodStart === dataset.periodStart &&
    snapshot.periodEnd === dataset.periodEnd &&
    snapshot.demandThreshold === dataset.demandThreshold &&
    snapshot.evaluationConsumption === dataset.evaluationConsumption &&
    JSON.stringify(snapshot.telemetry) === JSON.stringify(dataset.telemetry) &&
    JSON.stringify(snapshot.historicalConsumption) === JSON.stringify(dataset.historicalConsumption)
  return same ? 'current' : 'outdated'
}

export type AnalysisAction =
  | { kind: 'unavailable'; message: string }
  | { kind: 'completed'; message: string }
  | { kind: 'outdated'; message: string }
  | { kind: 'run'; label: string }

export function analysisAction(input: {
  canExecute: boolean
  dataset: TechnicalDataset | null
  analyses: readonly TechnicalAnalysis[]
}): AnalysisAction {
  if (!input.dataset) {
    return { kind: 'unavailable', message: 'No hay datos técnicos para esta solicitud.' }
  }
  const success = latestSuccessfulAnalysis(input.analyses)
  const currency = datasetCurrency(success, input.dataset)
  if (success && currency === 'current') {
    return {
      kind: 'completed',
      message: 'El análisis técnico ya fue completado para los datos actuales.',
    }
  }
  if (success && currency === 'outdated') {
    return {
      kind: 'outdated',
      message:
        'Los datos técnicos cambiaron después del último análisis exitoso. El resultado anterior se conserva y puede estar desactualizado.',
    }
  }
  if (!input.canExecute) {
    return {
      kind: 'unavailable',
      message: success
        ? 'Hay un análisis registrado. Su perfil puede consultarlo.'
        : 'Su perfil puede consultar el análisis, no ejecutarlo.',
    }
  }
  const failed = input.analyses.some((analysis) => analysis.status === 'FAILED')
  return { kind: 'run', label: failed ? 'Reintentar análisis' : 'Ejecutar análisis' }
}

export type ReportAction =
  | { kind: 'missing-analysis'; message: string }
  | { kind: 'outdated'; message: string }
  | { kind: 'existing'; message: string; report: TechnicalReport }
  | { kind: 'generate'; message: string }
  | { kind: 'wait'; message: string }

export function reportAction(input: {
  canCreate: boolean
  dataset: TechnicalDataset | null
  analyses: readonly TechnicalAnalysis[]
  reports: readonly TechnicalReport[]
}): ReportAction {
  const success = latestSuccessfulAnalysis(input.analyses)
  if (!success) {
    return {
      kind: 'missing-analysis',
      message: 'No es posible generar un informe porque todavía no existe un análisis exitoso.',
    }
  }
  const current = input.reports.find((report) => report.analysisId === success.id) ?? null
  const currency = datasetCurrency(success, input.dataset)
  if (currency === 'outdated') {
    return {
      kind: 'outdated',
      message: current
        ? 'Hay un borrador del análisis anterior. Los datos técnicos cambiaron; ejecute un análisis nuevo antes de generar otro informe.'
        : 'Los datos técnicos cambiaron. Ejecute un análisis nuevo antes de generar el informe.',
    }
  }
  if (current) {
    return {
      kind: 'existing',
      report: current,
      message: 'Este informe ya cuenta con un borrador generado. No es necesario volver a generar el informe.',
    }
  }
  if (!input.canCreate) {
    return {
      kind: 'wait',
      message: 'El borrador lo genera el especialista cuando el análisis ya está completado.',
    }
  }
  return {
    kind: 'generate',
    message: 'El análisis está listo. Puede generar el borrador del informe.',
  }
}
