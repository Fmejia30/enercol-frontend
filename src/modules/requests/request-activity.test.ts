import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { activityActorLabel, parseRequestActivity } from './request-activity.ts'

describe('historial de actividad', () => {
  it('conserva el comentario y no conserva un sujeto interno', () => {
    const [event] = parseRequestActivity({
      items: [
        {
          id: 'activity-1',
          eventType: 'CHANGES_REQUESTED',
          previousStatus: 'PENDING_VALIDATION',
          newStatus: 'REPORT_CHANGES_REQUESTED',
          description: 'El validador solicitó ajustes. Versión 2.',
          actor: { displayName: 'Laura Pineda', role: 'VALIDATOR' },
          actorSub: 'cognito-sub',
          technicalAnalysisId: null,
          technicalReportId: 'report-1',
          reportVersion: 2,
          metadata: { comments: 'Corregir el alcance.', actorSub: 'cognito-sub' },
          createdAt: '2026-11-15T18:00:00.000Z',
        },
      ],
    })
    assert.equal(event?.metadata.comments, 'Corregir el alcance.')
    assert.equal('actorSub' in (event ?? {}), false)
    assert.equal('actorSub' in (event?.metadata ?? {}), false)
    assert.equal(activityActorLabel(event!), 'Laura Pineda · Validador')
    assert.equal(activityActorLabel({ ...event!, actor: null }), 'Sistema')
  })
})
