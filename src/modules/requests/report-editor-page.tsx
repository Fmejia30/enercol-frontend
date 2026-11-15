import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { reportEditorPath, requestDetailPath } from '@/modules/requests/request-access.ts'
import { applyNarrative, narrativeChanged, narrativeFrom, type NarrativeDraft } from '@/modules/requests/report-editor.ts'
import { reportPdfDocument } from '@/modules/requests/report-pdf.ts'
import { downloadReportPdf } from '@/modules/requests/report-pdf-download.ts'
import { ReportWorkflowPanel } from '@/modules/requests/report-workflow-panel.tsx'
import { reportIsEditable } from '@/modules/requests/report-workflow.ts'
import {
  approveTechnicalReport,
  listTechnicalReportReviews,
  listTechnicalReports,
  readApprovedTechnicalReport,
  readPostSaleRequest,
  readTechnicalReportReview,
  requestTechnicalReportChanges,
  requireTechnicalReportReanalysis,
  saveTechnicalReportRevision,
  startTechnicalReportReview,
  submitTechnicalReport,
} from '@/modules/requests/requests-api.ts'
import {
  reportOriginLabel,
  reportStatusLabel,
  reportStatusTone,
  type TechnicalReport,
  type TechnicalReportReviewEvent,
} from '@/modules/requests/technical-report.ts'
import type { PostSaleRequestDetail } from '@/modules/requests/request-contract.ts'
import { formatInstant } from '@/shared/lib/date-time.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'
import { Button } from '@/shared/components/ui/button.tsx'

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 text-foreground outline-none focus-visible:border-energy-text focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export function ReportEditorPage() {
  const { requestId = '', reportId = '' } = useParams()
  const navigate = useNavigate()
  const allowLeave = useRef(false)
  const authorization = useAuthorization()
  const canEdit = authorization.hasPermission('reports:create')
  const isValidator = authorization.hasRole('VALIDATOR')
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<{
    key: string
    request: Pick<PostSaleRequestDetail, 'ticketCode' | 'customerName' | 'facilityName'> | null
    reports: TechnicalReport[]
    reviews: TechnicalReportReviewEvent[]
    error: string | null
  } | null>(null)
  const [selectedId, setSelectedId] = useState(reportId)
  const [draft, setDraft] = useState<NarrativeDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const key = `${requestId}\u0000${reportId}\u0000${attempt}`
  const current = snapshot?.key === key ? snapshot : null
  const reports = current?.reports ?? []
  const latest =
    reports.reduce<TechnicalReport | null>(
      (best, report) => (best === null || report.version > best.version ? report : best),
      null,
    ) ?? null
  const selected = reports.find((report) => report.id === selectedId) ?? latest
  const editable = Boolean(latest && reportIsEditable(latest.status))
  const editingLatest = Boolean(canEdit && selected && latest && selected.id === latest.id && editable)
  const dirty = Boolean(selected && draft && editingLatest && narrativeChanged(selected.content, draft))
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !allowLeave.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    document.title = `Informe técnico · ${appName()}`
  }, [])

  useEffect(() => {
    allowLeave.current = false
    const controller = new AbortController()
    const load = isValidator
      ? readTechnicalReportReview(requestId, reportId, controller.signal).then((packet) => ({
          request: packet.request,
          reports: packet.reports,
          reviews: packet.reviews,
        }))
      : Promise.all([
          readPostSaleRequest(requestId, controller.signal),
          listTechnicalReports(requestId, controller.signal),
          listTechnicalReportReviews(requestId, reportId, controller.signal),
        ]).then(([request, reports, reviews]) => ({ request, reports, reviews }))
    load
      .then(({ request, reports: items, reviews }) => {
        if (controller.signal.aborted) return
        setSnapshot({ key, request, reports: items, reviews, error: null })
        const match = items.find((item) => item.id === reportId) ?? items[0] ?? null
        setSelectedId(match?.id ?? reportId)
        setDraft(match ? narrativeFrom(match.content) : null)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot({ key, request: null, reports: [], reviews: [], error: toApiError(cause).message })
      })
    return () => controller.abort()
  }, [requestId, reportId, key, isValidator])

  useEffect(() => {
    if (!dirty) return
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [dirty])

  function chooseVersion(id: string) {
    if (id === selected?.id) return
    if (dirty && !window.confirm('Tienes cambios sin guardar.')) return
    const next = reports.find((report) => report.id === id)
    setSelectedId(id)
    setDraft(next ? narrativeFrom(next.content) : null)
    setNotice(null)
    setActionError(null)
  }

  async function save(source = selected) {
    if (!source || !draft || !latest || saving) return
    setSaving(true)
    setActionError(null)
    setNotice(null)
    try {
      const content = source.id === latest.id ? applyNarrative(source.content, draft) : source.content
      const saved = await saveTechnicalReportRevision(requestId, source.id, {
        baseVersion: latest.version,
        content,
      })
      setNotice('Los cambios se guardaron correctamente.')
      allowLeave.current = true
      navigate(reportEditorPath(requestId, saved.id), { replace: true })
    } catch (cause: unknown) {
      setActionError(toApiError(cause).message)
    } finally {
      setSaving(false)
    }
  }

  async function exportPdf() {
    if (!selected || !current?.request || dirty || exporting) return
    setExporting(true)
    setActionError(null)
    try {
      const author = selected.createdBy
        ? `${selected.createdBy.firstName} ${selected.createdBy.lastName}`
        : 'Autor no disponible'
      const context = {
        customerName: current.request.customerName,
        facilityName: current.request.facilityName,
        author,
      }
      if (selected.status === 'APPROVED') {
        const approved = await readApprovedTechnicalReport(requestId, selected.id)
        const approver = approved.approval.approver
          ? `${approved.approval.approver.firstName} ${approved.approval.approver.lastName}`
          : 'Aprobador no disponible'
        await downloadReportPdf(
          reportPdfDocument(approved.report, context, {
            version: approved.approval.version,
            approvedAt: approved.approval.approvedAt,
            approver,
          }),
          `${current.request.ticketCode}-v${approved.report.version}-aprobado.pdf`,
        )
      } else {
        await downloadReportPdf(
          reportPdfDocument(selected, context),
          `${current.request.ticketCode}-v${selected.version}.pdf`,
        )
      }
    } catch (cause: unknown) {
      setActionError(toApiError(cause).message)
    } finally {
      setExporting(false)
    }
  }

  async function runReview(action: () => Promise<unknown>, message: string) {
    if (reviewing) return
    setReviewing(true)
    setActionError(null)
    setNotice(null)
    try {
      await action()
      setNotice(message)
      setAttempt((value) => value + 1)
    } catch (cause: unknown) {
      setActionError(toApiError(cause).message)
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
      <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={requestDetailPath(requestId)} className="font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4">
          Solicitud
        </Link>
        <span aria-hidden="true" className="text-subtle">/</span>
        <span className="text-muted">Informe</span>
      </nav>
      {current === null ? <p className="text-sm text-muted">Cargando el informe</p> : null}
      {current?.error ? (
        <Alert tone="error" title="No fue posible abrir el informe">{current.error}</Alert>
      ) : null}
      {selected && draft && current?.request ? (
        <>
          <header className="grid gap-2 border-b border-line pb-5">
            <Badge tone={reportStatusTone(selected.status)}>{reportStatusLabel(selected.status)}</Badge>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">{selected.content.title}</h1>
            <p className="text-sm leading-6 text-muted">
              {current.request.ticketCode} · {current.request.customerName} · {current.request.facilityName}
            </p>
            <p className="text-sm leading-6 text-muted">
              {reportOriginLabel(selected.origin)} · Versión {selected.version}
              {latest && selected.id === latest.id ? ' · Versión actual' : ''} · {formatInstant(selected.updatedAt)}
            </p>
          </header>
          {dirty ? <p className="text-sm font-semibold text-foreground">Tienes cambios sin guardar.</p> : null}
          {notice ? <Alert tone="info" title="Informe guardado">{notice}</Alert> : null}
          {actionError ? <Alert tone="error" title="No fue posible completar la acción">{actionError}</Alert> : null}
          <div className="flex flex-wrap gap-2">
            {reports.map((report) => (
              <Button
                key={report.id}
                type="button"
                size="sm"
                variant={report.id === selected.id ? 'primary' : 'secondary'}
                onClick={() => chooseVersion(report.id)}
              >
                Versión {report.version}
              </Button>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted">
            Los valores medidos, las referencias y la evidencia provienen del análisis. Se consultan aquí y se corrigen volviendo a analizar los datos.
          </p>
          {latest ? (
            <ReportWorkflowPanel
              requestId={requestId}
              report={selected.id === latest.id ? latest : selected}
              isLatest={selected.id === latest.id}
              dirty={dirty}
              canEdit={canEdit}
              isValidator={isValidator}
              busy={reviewing}
              reviews={current.reviews}
              onSubmit={() => runReview(() => submitTechnicalReport(requestId, latest.id), 'El informe se envió a validación.')}
              onStart={() => runReview(() => startTechnicalReportReview(requestId, latest.id), 'La revisión quedó iniciada.')}
              onApprove={() => runReview(() => approveTechnicalReport(requestId, latest.id), 'La versión quedó aprobada.')}
              onRequestChanges={(comments) =>
                runReview(() => requestTechnicalReportChanges(requestId, latest.id, comments), 'Los cambios quedaron solicitados.')
              }
              onRequireReanalysis={(comments) =>
                runReview(
                  () => requireTechnicalReportReanalysis(requestId, latest.id, comments),
                  'Quedó registrado que el análisis debe repetirse.',
                )
              }
            />
          ) : null}
          <EditorFields draft={draft} locked={!editingLatest} onChange={setDraft} source={selected} />
          <div className="flex flex-wrap gap-3">
            {editingLatest ? (
              <Button type="button" loading={saving} disabled={!dirty} onClick={() => void save()}>
                {latest?.status === 'CHANGES_REQUESTED' ? 'Guardar corrección' : 'Guardar cambios'}
              </Button>
            ) : canEdit && editable ? (
              <Button
                type="button"
                variant="secondary"
                loading={saving}
                onClick={() => {
                  if (window.confirm('Se creará una versión nueva con el contenido de esta versión. El historial se conserva.')) {
                    void save(selected)
                  }
                }}
              >
                Restaurar como nueva versión
              </Button>
            ) : isValidator ? (
              <p className="text-sm leading-6 text-muted">
                El contenido se consulta aquí. Las decisiones de validación quedan en el historial.
              </p>
            ) : (
              <p className="text-sm leading-6 text-muted">Su perfil puede leer el informe. La edición corresponde al especialista.</p>
            )}
            <Button type="button" variant="secondary" loading={exporting} disabled={dirty} onClick={() => void exportPdf()}>
              {selected.status === 'APPROVED' ? 'Descargar PDF aprobado' : 'Descargar PDF'}
            </Button>
          </div>
          {dirty ? (
            <p className="text-sm leading-6 text-muted">Guarde los cambios para descargar el PDF de la versión guardada.</p>
          ) : null}
        </>
      ) : null}
      {blocker.state === 'blocked' ? (
        <div role="alertdialog" aria-labelledby="cambios-sin-guardar" className="grid max-w-xl gap-4 rounded-md border border-line bg-elevated p-4">
          <h2 id="cambios-sin-guardar" className="text-base font-semibold">Tienes cambios sin guardar.</h2>
          <p className="text-sm leading-6 text-muted">Si sale ahora, esta edición no se conservará.</p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => blocker.reset()}>Seguir editando</Button>
            <Button type="button" variant="destructive" onClick={() => blocker.proceed()}>Salir sin guardar</Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function EditorFields({
  draft,
  locked,
  onChange,
  source,
}: {
  draft: NarrativeDraft
  locked: boolean
  onChange: (draft: NarrativeDraft) => void
  source: TechnicalReport
}) {
  function update(patch: Partial<NarrativeDraft>) {
    onChange({ ...draft, ...patch })
  }
  const prose: Array<{ label: string; value: string; key: keyof NarrativeDraft }> = [
    { label: 'Título', value: draft.title, key: 'title' },
    { label: 'Resumen ejecutivo', value: draft.executiveSummary, key: 'executiveSummary' },
    { label: 'Antecedentes', value: draft.background, key: 'background' },
    { label: 'Alcance', value: draft.scope, key: 'scope' },
    { label: 'Comparación contractual', value: draft.contractualComparison, key: 'contractualComparison' },
    { label: 'Interpretación', value: draft.interpretation, key: 'interpretation' },
    { label: 'Impacto financiero', value: draft.financialNarrative, key: 'financialNarrative' },
    { label: 'Conclusiones', value: draft.conclusions, key: 'conclusions' },
  ]
  return (
    <div className="grid gap-8">
      <section className="grid gap-2 rounded-md bg-sunken px-4 py-3 text-sm">
        <h2 className="text-sm font-semibold">Identificación</h2>
        <p className="text-muted">Valores del análisis. No se editan en el informe.</p>
        <p>{source.content.identification.ticketCode}</p>
        <p>
          {source.content.identification.periodStart} – {source.content.identification.periodEnd}
        </p>
      </section>
      <div className="grid gap-5">
        <h2 className="text-sm font-semibold">Texto del informe</h2>
      {prose.map((field) => (
        <label key={field.key} className="grid gap-2 text-sm font-semibold">
          {field.label}
          <textarea
            className={fieldClass}
            rows={field.key === 'title' ? 2 : 4}
            value={field.value}
            readOnly={locked}
            onChange={(event) => update({ [field.key]: event.target.value })}
          />
        </label>
      ))}
      {source.content.historicalAnalysis === null ? (
        <p className="text-sm leading-6 text-muted">No hay información histórica disponible.</p>
      ) : (
        <label className="grid gap-2 text-sm font-semibold">
          Análisis histórico
          <textarea
            className={fieldClass}
            rows={4}
            value={draft.historicalAnalysis ?? ''}
            readOnly={locked}
            onChange={(event) => update({ historicalAnalysis: event.target.value })}
          />
        </label>
      )}
      {source.content.technicalFindings.map((finding, index) => (
        <section key={finding.findingType} className="grid gap-3 border-t border-line pt-4">
          <h2 className="text-sm font-semibold">Hallazgo técnico</h2>
          <dl className="grid gap-1 rounded-md bg-sunken px-4 py-3 text-sm text-muted">
            <div>Medido: {finding.measuredValue} {finding.unit}</div>
            <div>Referencia: {finding.referenceValue} {finding.unit}</div>
            <div>Diferencia: {finding.difference} {finding.unit}</div>
            <div>Variación: {finding.percentage} %</div>
          </dl>
          <label className="grid gap-2 text-sm font-semibold">
            Explicación
            <textarea
              className={fieldClass}
              rows={4}
              readOnly={locked}
              value={draft.findingNarratives[index] ?? ''}
              onChange={(event) => {
                const findingNarratives = [...draft.findingNarratives]
                findingNarratives[index] = event.target.value
                update({ findingNarratives })
              }}
            />
          </label>
        </section>
      ))}
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Evidencia</h2>
        <ul className="grid gap-1 rounded-md bg-sunken px-4 py-3 text-sm text-muted">
          {source.content.evidence.map((item) => (
            <li key={`${item.label}-${item.value}`}>{item.label}: {item.value} {item.unit}</li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Hipótesis, no causa verificada</h2>
        {draft.hypotheses.map((item, index) => (
          <div key={index} className="grid gap-2">
            <label className="grid gap-2 text-sm font-semibold">
              Hipótesis
              <textarea
                className={fieldClass}
                rows={3}
                readOnly={locked}
                value={item.statement}
                onChange={(event) => {
                  const hypotheses = draft.hypotheses.map((hypothesis, hypothesisIndex) =>
                    hypothesisIndex === index ? { ...hypothesis, statement: event.target.value } : hypothesis,
                  )
                  update({ hypotheses })
                }}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Base
              <textarea
                className={fieldClass}
                rows={3}
                readOnly={locked}
                value={item.basis}
                onChange={(event) => {
                  const hypotheses = draft.hypotheses.map((hypothesis, hypothesisIndex) =>
                    hypothesisIndex === index ? { ...hypothesis, basis: event.target.value } : hypothesis,
                  )
                  update({ hypotheses })
                }}
              />
            </label>
          </div>
        ))}
      </section>
      <ListEditor label="Recomendaciones preliminares" items={draft.recommendations} locked={locked} onChange={(recommendations) => update({ recommendations })} />
      <ListEditor label="Limitaciones" items={draft.limitations} locked={locked} onChange={(limitations) => update({ limitations })} />
      </div>
    </div>
  )
}

function ListEditor({
  label,
  items,
  locked,
  onChange,
}: {
  label: string
  items: string[]
  locked: boolean
  onChange: (items: string[]) => void
}) {
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-semibold">{label}</h2>
      {items.map((item, index) => (
        <textarea
          key={index}
          className={fieldClass}
          rows={3}
          readOnly={locked}
          aria-label={`${label} ${index + 1}`}
          value={item}
          onChange={(event) => onChange(items.map((current, itemIndex) => (itemIndex === index ? event.target.value : current)))}
        />
      ))}
    </section>
  )
}
