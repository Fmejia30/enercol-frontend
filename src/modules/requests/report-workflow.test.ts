import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { idleReportReview, parsePendingTechnicalReports, reportStatusLabel } from './technical-report.ts'
import {
  administratorKeepsReportAccess,
  canDownloadFinalPdf,
  commentIsValid,
  pendingQueueVisible,
  reportIsEditable,
  reviewHistoryKeeps,
  specialistReportActions,
  submittedVersionIsReadOnly,
  validatorReportActions,
} from './report-workflow.ts'

describe('acciones del informe por rol', () => {
  it('ofrece edición y envío al especialista, y no la aprobación', () => {
    assert.deepEqual(specialistReportActions({ canEdit: true, canSubmit: true, isLatest: true, dirty: false, status: 'DRAFT' }), [
      'edit',
      'submit',
    ])
    assert.deepEqual(specialistReportActions({ canEdit: true, canSubmit: false, isLatest: true, dirty: false, status: 'DRAFT' }), ['edit'])
    assert.deepEqual(specialistReportActions({ canEdit: true, canSubmit: true, isLatest: true, dirty: true, status: 'DRAFT' }), ['edit'])
    assert.deepEqual(
      specialistReportActions({ canEdit: true, canSubmit: true, isLatest: true, dirty: false, status: 'CHANGES_REQUESTED' }),
      ['continue'],
    )
    assert.deepEqual(
      specialistReportActions({ canEdit: true, canSubmit: true, isLatest: true, dirty: false, status: 'REANALYSIS_REQUIRED' }),
      ['reanalyze'],
    )
    assert.deepEqual(
      validatorReportActions({ isValidator: false, isLatest: true, status: 'PENDING_VALIDATION' }),
      [],
    )
    assert.equal(administratorKeepsReportAccess({ canEdit: true, isValidator: false }), true)
    assert.equal(reportIsEditable('PENDING_VALIDATION'), false)
    assert.equal(reportIsEditable('APPROVED'), false)
  })

  it('ofrece la revisión solo al validador y exige comentario', () => {
    assert.deepEqual(validatorReportActions({ isValidator: true, isLatest: true, status: 'PENDING_VALIDATION' }), ['start'])
    assert.deepEqual(validatorReportActions({ isValidator: true, isLatest: true, status: 'UNDER_REVIEW' }), [
      'approve',
      'changes',
      'reanalysis',
    ])
    assert.deepEqual(validatorReportActions({ isValidator: true, isLatest: true, status: 'APPROVED' }), [])
    assert.deepEqual(validatorReportActions({ isValidator: true, isLatest: false, status: 'UNDER_REVIEW' }), [])
    assert.equal(specialistReportActions({ canEdit: false, canSubmit: false, isLatest: true, dirty: false, status: 'UNDER_REVIEW' }).length, 0)
    assert.equal(submittedVersionIsReadOnly({ canEdit: false, status: 'UNDER_REVIEW' }), true)
    assert.equal(commentIsValid('  '), false)
    assert.equal(commentIsValid('Corregir el alcance.'), true)
    assert.equal(pendingQueueVisible(true), true)
    assert.equal(pendingQueueVisible(false), false)
    assert.equal(canDownloadFinalPdf('APPROVED'), true)
    assert.equal(canDownloadFinalPdf('DRAFT'), false)
  })

  it('muestra la cola y conserva las decisiones anteriores', () => {
    const page = parsePendingTechnicalReports({
      page: 1,
      pageSize: 20,
      total: 1,
      items: [
        {
          requestId: 'request-1',
          reportId: 'report-1',
          ticketCode: 'PV-A05-001',
          customerName: 'Textiles del Altiplano S.A.S.',
          facilityName: 'Planta Fontibón',
          title: 'Borrador de verificación de demanda',
          version: 3,
          status: 'PENDING_VALIDATION',
          submittedAt: '2026-11-15T18:00:00.000Z',
          submittedBy: { firstName: 'Carlos', lastName: 'Méndez' },
        },
      ],
    })
    assert.equal(page.items[0]?.version, 3)
    assert.equal(reportStatusLabel(page.items[0]?.status ?? 'DRAFT'), 'Pendiente de validación')
    assert.deepEqual(reviewHistoryKeeps(['CHANGES_REQUESTED'], 'APPROVED'), ['CHANGES_REQUESTED', 'APPROVED'])
    assert.equal(idleReportReview.approvedVersion, null)
  })
})
