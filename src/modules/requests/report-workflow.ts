import type { TechnicalReport, TechnicalReportReviewEvent } from './technical-report.ts'

export type SpecialistReportAction = 'edit' | 'submit' | 'continue' | 'reanalyze'
export type ValidatorReportAction = 'start' | 'approve' | 'changes' | 'reanalysis'

export function reportIsEditable(status: TechnicalReport['status']) {
  return status === 'DRAFT' || status === 'CHANGES_REQUESTED'
}

export function specialistReportActions(input: {
  canEdit: boolean
  canSubmit: boolean
  isLatest: boolean
  dirty: boolean
  status: TechnicalReport['status']
}): SpecialistReportAction[] {
  if (!input.canEdit || !input.isLatest) return []
  if (input.status === 'REANALYSIS_REQUIRED') return ['reanalyze']
  if (input.status === 'CHANGES_REQUESTED') return ['continue']
  if (input.status === 'DRAFT' && input.canSubmit) return input.dirty ? ['edit'] : ['edit', 'submit']
  if (input.status === 'DRAFT') return ['edit']
  return []
}

export function validatorReportActions(input: {
  isValidator: boolean
  isLatest: boolean
  status: TechnicalReport['status']
}): ValidatorReportAction[] {
  if (!input.isValidator || !input.isLatest) return []
  if (input.status === 'PENDING_VALIDATION') return ['start']
  if (input.status === 'UNDER_REVIEW') return ['approve', 'changes', 'reanalysis']
  return []
}

export function canDownloadFinalPdf(status: TechnicalReport['status']) {
  return status === 'APPROVED'
}

export function commentIsValid(value: string) {
  const comments = value.trim()
  return comments.length > 0 && comments.length <= 2000
}

export function administratorKeepsReportAccess(input: { canEdit: boolean; isValidator: boolean }) {
  return input.canEdit && !input.isValidator
}

export function pendingQueueVisible(isValidator: boolean) {
  return isValidator
}

export function submittedVersionIsReadOnly(input: { canEdit: boolean; status: TechnicalReport['status'] }) {
  return !input.canEdit || !reportIsEditable(input.status)
}

export function reviewHistoryKeeps(previous: readonly TechnicalReportReviewEvent['type'][], next: TechnicalReportReviewEvent['type']) {
  return [...previous, next]
}
