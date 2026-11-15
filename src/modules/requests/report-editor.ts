import type { TechnicalReportContent } from './technical-report.ts'

export interface NarrativeDraft {
  title: string
  executiveSummary: string
  background: string
  scope: string
  contractualComparison: string
  historicalAnalysis: string | null
  interpretation: string
  findingNarratives: string[]
  hypotheses: Array<{ statement: string; basis: string }>
  financialNarrative: string
  recommendations: string[]
  limitations: string[]
  conclusions: string
}

export function narrativeFrom(content: TechnicalReportContent): NarrativeDraft {
  return {
    title: content.title,
    executiveSummary: content.executiveSummary,
    background: content.background,
    scope: content.scope,
    contractualComparison: content.contractualComparison,
    historicalAnalysis: content.historicalAnalysis,
    interpretation: content.interpretation,
    findingNarratives: content.technicalFindings.map((finding) => finding.narrative),
    hypotheses: content.hypotheses.map((item) => ({ statement: item.statement, basis: item.basis })),
    financialNarrative: content.financialImpact.narrative,
    recommendations: content.recommendations.map((item) => item.text),
    limitations: [...content.limitations],
    conclusions: content.conclusions,
  }
}

export function applyNarrative(
  source: TechnicalReportContent,
  draft: NarrativeDraft,
): TechnicalReportContent {
  return {
    ...source,
    title: draft.title,
    executiveSummary: draft.executiveSummary,
    background: draft.background,
    scope: draft.scope,
    contractualComparison: draft.contractualComparison,
    historicalAnalysis: source.historicalAnalysis === null ? null : draft.historicalAnalysis,
    interpretation: draft.interpretation,
    technicalFindings: source.technicalFindings.map((finding, index) => ({
      ...finding,
      narrative: draft.findingNarratives[index] ?? finding.narrative,
    })),
    hypotheses: draft.hypotheses.map((item) => ({ statement: item.statement, basis: item.basis })),
    financialImpact: {
      status: 'unavailable',
      narrative: draft.financialNarrative,
    },
    recommendations: draft.recommendations.map((text) => ({ text })),
    limitations: [...draft.limitations],
    conclusions: draft.conclusions,
    evidence: source.evidence.map((item) => ({ ...item })),
    identification: { ...source.identification },
    draftStatus: 'DRAFT',
    schemaVersion: 1,
  }
}

export function narrativeChanged(source: TechnicalReportContent, draft: NarrativeDraft) {
  return JSON.stringify(applyNarrative(source, draft)) !== JSON.stringify(source)
}
