import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { reportAction } from '@/modules/requests/analysis-workflow.ts'
import { reportEditorPath } from '@/modules/requests/request-access.ts'
import {
  generateTechnicalReport,
  listTechnicalReports,
  readTechnicalAnalyses,
  readTechnicalDataset,
} from '@/modules/requests/requests-api.ts'
import { generationSummary, reportStatusLabel, type TechnicalReport } from '@/modules/requests/technical-report.ts'
import type { TechnicalAnalysis, TechnicalDataset } from '@/modules/requests/technical-analysis.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'

type ReportSnapshot = {
  key: string
  reports: TechnicalReport[]
  analyses: TechnicalAnalysis[]
  dataset: TechnicalDataset | null
  error: string | null
}

export function RequestReportSection({ requestId }: { requestId: string }) {
  const navigate = useNavigate()
  const authorization = useAuthorization()
  const canCreate = authorization.hasPermission('reports:create')
  const canRead = authorization.hasPermission('reports:read')
  const [attempt, setAttempt] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null)
  const key = `${requestId}\u0000${attempt}`
  const current = snapshot?.key === key ? snapshot : null
  const action = current && !current.error
    ? reportAction({
        canCreate,
        dataset: current.dataset,
        analyses: current.analyses,
        reports: current.reports,
      })
    : null
  const currentReport =
    action?.kind === 'existing'
      ? action.report
      : (current?.reports.find((report) => report.analysisId === current.analyses.find((item) => item.status === 'SUCCEEDED')?.id) ??
        current?.reports[0] ??
        null)

  useEffect(() => {
    if (!canRead) return
    const controller = new AbortController()
    const keyAtStart = key
    const datasetRequest = readTechnicalDataset(requestId, controller.signal).then(
      (dataset) => dataset,
      (cause: unknown) => {
        if (toApiError(cause).status === 404) return null
        throw cause
      },
    )
    Promise.all([
      listTechnicalReports(requestId, controller.signal),
      readTechnicalAnalyses(requestId, controller.signal),
      datasetRequest,
    ])
      .then(([reports, analyses, dataset]) => {
        if (controller.signal.aborted) return
        setSnapshot({ key: keyAtStart, reports, analyses, dataset, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot({ key: keyAtStart, reports: [], analyses: [], dataset: null, error: toApiError(cause).message })
      })
    return () => controller.abort()
  }, [requestId, attempt, canRead, key])

  async function generate() {
    if (generating || action?.kind !== 'generate') return
    setGenerating(true)
    setActionError(null)
    try {
      const created = await generateTechnicalReport(requestId)
      navigate(reportEditorPath(requestId, created.id))
    } catch (cause: unknown) {
      setActionError(toApiError(cause).message)
    } finally {
      setGenerating(false)
    }
  }

  if (!canRead) return null

  return (
    <section aria-labelledby="informe-tecnico" className="border-t border-line pt-6">
      <h2 id="informe-tecnico" className="text-sm font-semibold">
        Informe técnico
      </h2>
      {current === null ? <p className="mt-3 text-sm text-muted">Cargando informes</p> : null}
      {current?.error ? (
        <div className="mt-4 grid max-w-xl gap-4">
          <Alert tone="error" title="No fue posible cargar el informe">
            {current.error}
          </Alert>
          <Button type="button" variant="secondary" className="w-fit" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      ) : null}
      {action ? <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{action.message}</p> : null}
      {generating ? (
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          Generando el borrador del informe. Esto puede tardar un momento.
        </p>
      ) : null}
      {action?.kind === 'generate' ? (
        <Button type="button" className="mt-4 w-fit" loading={generating} onClick={() => void generate()}>
          Generar borrador
        </Button>
      ) : null}
      {actionError ? (
        <div className="mt-4 max-w-xl">
          <Alert tone="error" title="No fue posible generar el borrador">
            {actionError}
          </Alert>
        </div>
      ) : null}
      {currentReport ? (
        <article className="mt-5 grid max-w-2xl gap-3">
          <h3 className="text-lg font-semibold text-foreground">{currentReport.content.title}</h3>
          <p className="text-sm text-muted">{reportStatusLabel(currentReport.status)}</p>
          <p className="text-sm leading-6 text-muted">{generationSummary(currentReport)}</p>
          <Link
            to={reportEditorPath(requestId, currentReport.id)}
            className="inline-flex h-12 w-fit items-center rounded-md bg-energy px-4 text-base font-semibold text-on-energy focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            {canCreate ? 'Abrir editor' : 'Abrir informe'}
          </Link>
        </article>
      ) : null}
    </section>
  )
}
