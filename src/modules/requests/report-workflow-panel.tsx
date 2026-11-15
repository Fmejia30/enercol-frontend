import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestDetailPath } from '@/modules/requests/request-access.ts'
import {
  commentIsValid,
  specialistReportActions,
  validatorReportActions,
} from '@/modules/requests/report-workflow.ts'
import {
  reportStatusLabel,
  reviewEventLabel,
  type TechnicalReport,
  type TechnicalReportReviewEvent,
} from '@/modules/requests/technical-report.ts'
import { formatInstant } from '@/shared/lib/date-time.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:border-energy-text focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function ReportWorkflowPanel({
  requestId,
  report,
  isLatest,
  dirty,
  canEdit,
  isValidator,
  busy,
  reviews,
  onSubmit,
  onStart,
  onApprove,
  onRequestChanges,
  onRequireReanalysis,
}: {
  requestId: string
  report: TechnicalReport
  isLatest: boolean
  dirty: boolean
  canEdit: boolean
  isValidator: boolean
  busy: boolean
  reviews: readonly TechnicalReportReviewEvent[]
  onSubmit: () => Promise<void>
  onStart: () => Promise<void>
  onApprove: () => Promise<void>
  onRequestChanges: (comments: string) => Promise<void>
  onRequireReanalysis: (comments: string) => Promise<void>
}) {
  const [dialog, setDialog] = useState<'submit' | 'approve' | 'changes' | 'reanalysis' | null>(null)
  const [comments, setComments] = useState('')
  const specialist = specialistReportActions({
    canEdit,
    canSubmit: report.review.canSubmit,
    isLatest,
    dirty,
    status: report.status,
  })
  const validator = validatorReportActions({
    isValidator,
    isLatest,
    status: report.status,
  })
  const decision = isLatest ? report.review.decision : null

  async function confirm() {
    if (!dialog || busy) return
    if ((dialog === 'changes' || dialog === 'reanalysis') && !commentIsValid(comments)) return
    const text = comments.trim()
    if (dialog === 'submit') await onSubmit()
    if (dialog === 'approve') await onApprove()
    if (dialog === 'changes') await onRequestChanges(text)
    if (dialog === 'reanalysis') await onRequireReanalysis(text)
    setDialog(null)
    setComments('')
  }

  return (
    <section className="grid gap-4" aria-labelledby="validacion-informe">
      <h2 id="validacion-informe" className="text-sm font-semibold">
        Validación
      </h2>
      {report.status === 'APPROVED' ? (
        <p className="text-sm leading-6 text-muted">
          Informe aprobado · Versión {report.review.approvedVersion ?? report.version}
          {report.review.approvedAt ? ` · ${formatInstant(report.review.approvedAt)}` : ''}
          {report.review.approvedBy
            ? ` · ${report.review.approvedBy.firstName} ${report.review.approvedBy.lastName}`
            : ''}
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted">
          Estado: {reportStatusLabel(report.status)}
          {report.review.submittedVersion ? ` · Versión enviada ${report.review.submittedVersion}` : ''}
        </p>
      )}
      {decision?.comments ? (
        <Alert tone="info" title={reviewEventLabel(decision.type)}>
          {decision.comments}
          {decision.by ? ` ${decision.by.firstName} ${decision.by.lastName}.` : ''}
        </Alert>
      ) : null}
      {specialist.includes('continue') ? (
        <p className="text-sm leading-6 text-muted">
          Puede corregir el texto y guardar una versión nueva. Después vuelva a enviarla a validación.
        </p>
      ) : null}
      {specialist.includes('reanalyze') ? (
        <p className="text-sm leading-6 text-muted">
          El validador pidió repetir el análisis técnico. Use el análisis existente y, cuando termine, genere un borrador nuevo.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {specialist.includes('submit') ? (
          <Button type="button" disabled={busy} onClick={() => setDialog('submit')}>
            Enviar a validación
          </Button>
        ) : null}
        {specialist.includes('reanalyze') ? (
          <Link
            to={requestDetailPath(requestId)}
            className="inline-flex h-12 items-center rounded-md bg-energy px-4 text-base font-semibold text-on-energy focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            Ir al análisis técnico
          </Link>
        ) : null}
        {validator.includes('start') ? (
          <Button
            type="button"
            loading={busy}
            disabled={busy || report.status !== 'PENDING_VALIDATION'}
            onClick={() => {
              if (report.status !== 'PENDING_VALIDATION') return
              void onStart()
            }}
          >
            Iniciar revisión
          </Button>
        ) : null}
        {validator.includes('approve') ? (
          <Button type="button" disabled={busy} onClick={() => setDialog('approve')}>
            Aprobar informe
          </Button>
        ) : null}
        {validator.includes('changes') ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setDialog('changes')}>
            Solicitar ajustes
          </Button>
        ) : null}
        {validator.includes('reanalysis') ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setDialog('reanalysis')}>
            Requerir reanálisis
          </Button>
        ) : null}
      </div>
      <div className="grid gap-2">
        <h3 className="text-sm font-semibold">Historial de validación</h3>
        {reviews.length > 0 ? (
          <ol className="grid gap-2 text-sm leading-6 text-muted">
            {reviews.map((event) => (
              <li key={event.id}>
                {reviewEventLabel(event.type)} · Versión {event.version} · {formatInstant(event.at)}
                {event.by ? ` · ${event.by.firstName} ${event.by.lastName}` : ''}
                {event.comments ? ` · ${event.comments}` : ''}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm leading-6 text-muted">Todavía no hay eventos de validación.</p>
        )}
      </div>
      {dialog ? (
        <div role="alertdialog" aria-labelledby="confirmar-validacion" className="grid max-w-xl gap-4 rounded-md border border-line bg-elevated p-4">
          <h2 id="confirmar-validacion" className="text-base font-semibold">
            {dialog === 'submit'
              ? `Enviar la versión ${report.version}`
              : dialog === 'approve'
                ? `Aprobar informe · versión ${report.version}`
                : dialog === 'changes'
                  ? 'Solicitar ajustes'
                  : 'Requerir reanálisis'}
          </h2>
          <p className="text-sm leading-6 text-muted">
            {dialog === 'approve'
              ? `Se aprobará «${report.content.title}», versión ${report.version}. Esa versión queda como la versión oficial aprobada.`
              : dialog === 'submit'
                ? 'La versión enviada no se podrá editar hasta que el validador responda.'
                : dialog === 'changes'
                  ? 'El informe volverá al especialista para correcciones. El comentario es obligatorio y queda en el historial.'
                  : 'El análisis técnico debe reconsiderarse. El comentario es obligatorio y queda en el historial.'}
          </p>
          {dialog === 'changes' || dialog === 'reanalysis' ? (
            <label className="grid gap-2 text-sm font-semibold">
              Comentario
              <textarea className={fieldClass} rows={4} value={comments} onChange={(event) => setComments(event.target.value)} />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              loading={busy}
              disabled={(dialog === 'changes' || dialog === 'reanalysis') && !commentIsValid(comments)}
              onClick={() => void confirm()}
            >
              Confirmar
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
