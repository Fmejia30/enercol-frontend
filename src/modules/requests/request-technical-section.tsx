import { useEffect, useState } from 'react'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { analysisAction } from '@/modules/requests/analysis-workflow.ts'
import {
  analysisStatusLabel,
  datasetLines,
  evidenceLine,
  executedAtLabel,
  findingLines,
  historyLine,
  interpretationLabel,
  telemetryLine,
  type TechnicalAnalysis,
  type TechnicalDataset,
} from '@/modules/requests/technical-analysis.ts'
import {
  executeTechnicalAnalysis,
  readTechnicalAnalyses,
  readTechnicalDataset,
} from '@/modules/requests/requests-api.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'
import { Button } from '@/shared/components/ui/button.tsx'

type TechnicalSnapshot = {
  key: string
  dataset: TechnicalDataset | null
  datasetMissing: boolean
  analyses: TechnicalAnalysis[]
  error: string | null
}

export function RequestTechnicalSection({ requestId }: { requestId: string }) {
  const authorization = useAuthorization()
  const canExecute = authorization.hasPermission('analysis:execute')
  const canReadAnalysis = authorization.hasPermission('analysis:read')
  const [attempt, setAttempt] = useState(0)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<TechnicalSnapshot | null>(null)
  const key = `${requestId}\u0000${attempt}`
  const current = snapshot?.key === key ? snapshot : null

  useEffect(() => {
    const controller = new AbortController()
    const keyAtStart = `${requestId}\u0000${attempt}`
    const datasetRequest = readTechnicalDataset(requestId, controller.signal).then(
      (dataset) => ({ dataset, datasetMissing: false }),
      (cause: unknown) => {
        if (toApiError(cause).status === 404) return { dataset: null, datasetMissing: true }
        throw cause
      },
    )
    const analysisRequest = canReadAnalysis
      ? readTechnicalAnalyses(requestId, controller.signal)
      : Promise.resolve([])
    Promise.all([datasetRequest, analysisRequest])
      .then(([datasetResult, analyses]) => {
        if (controller.signal.aborted) return
        setSnapshot({
          key: keyAtStart,
          dataset: datasetResult.dataset,
          datasetMissing: datasetResult.datasetMissing,
          analyses,
          error: null,
        })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot({
          key: keyAtStart,
          dataset: null,
          datasetMissing: false,
          analyses: [],
          error: toApiError(cause).message,
        })
      })
    return () => controller.abort()
  }, [requestId, attempt, canReadAnalysis])

  const action =
    current?.dataset && !current.error
      ? analysisAction({ canExecute, dataset: current.dataset, analyses: current.analyses })
      : null
  const canRun = action?.kind === 'run' || action?.kind === 'outdated'

  async function runAnalysis() {
    if (running || !canRun) return
    setRunning(true)
    setRunError(null)
    try {
      await executeTechnicalAnalysis(requestId)
      setAttempt((value) => value + 1)
    } catch (cause: unknown) {
      setRunError(toApiError(cause).message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <section aria-labelledby="informacion-tecnica" className="border-t border-line pt-6">
      <h2 id="informacion-tecnica" className="text-sm font-semibold">
        Información técnica
      </h2>
      {current === null ? <p className="mt-3 text-sm text-muted">Cargando datos técnicos</p> : null}
      {current?.error ? (
        <div className="mt-4 grid max-w-xl gap-4">
          <Alert tone="error" title="No fue posible cargar los datos técnicos">
            {current.error}
          </Alert>
          <Button type="button" variant="secondary" className="w-fit" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar
          </Button>
        </div>
      ) : null}
      {current && !current.error && current.datasetMissing ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">No hay datos técnicos para esta solicitud.</p>
      ) : null}
      {current?.dataset ? (
        <div className="mt-4 grid gap-6">
          <ul className="grid gap-2 text-sm text-foreground">
            {datasetLines(current.dataset).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {current.dataset.telemetry.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">Lecturas de demanda</h3>
              <ul className="mt-2 grid gap-1 text-sm text-muted">
                {current.dataset.telemetry.map((reading) => (
                  <li key={reading.measuredAt}>{telemetryLine(reading, current.dataset?.demandUnit ?? 'kW')}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {current.dataset.historicalConsumption.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-foreground">Consumo histórico</h3>
              <ul className="mt-2 grid gap-1 text-sm text-muted">
                {current.dataset.historicalConsumption.map((row) => (
                  <li key={row.periodStart}>{historyLine(row, current.dataset?.consumptionUnit ?? 'kWh')}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {action && action.kind !== 'unavailable' ? (
        <div className="mt-6 grid max-w-xl gap-3">
          {action.kind === 'outdated' ? <Badge tone="warning">Análisis desactualizado</Badge> : null}
          {action.kind === 'completed' || action.kind === 'outdated' ? (
            <p className="text-sm leading-6 text-muted">{action.message}</p>
          ) : null}
          {running ? (
            <p className="text-sm text-muted" aria-live="polite">
              Ejecutando el análisis técnico.
            </p>
          ) : null}
          {canRun ? (
            <Button type="button" className="w-fit" loading={running} onClick={() => void runAnalysis()}>
              {action.kind === 'run' ? action.label : 'Ejecutar análisis con los datos actuales'}
            </Button>
          ) : null}
          {runError ? (
            <Alert tone="error" title="No fue posible ejecutar el análisis">
              {runError}
            </Alert>
          ) : null}
        </div>
      ) : null}
      {canReadAnalysis && current && !current.error ? (
        <div className="mt-8 grid gap-6">
          <h3 className="text-sm font-semibold text-foreground">Ejecuciones</h3>
          {current.analyses.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay análisis para esta solicitud.</p>
          ) : (
            <ol className="grid gap-6">
              {current.analyses.map((analysis) => (
                <li key={analysis.id} className="border-t border-line pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {executedAtLabel(analysis.executedAt)}
                    </p>
                    <Badge tone={analysis.status === 'SUCCEEDED' ? 'success' : 'danger'}>{analysisStatusLabel(analysis.status)}</Badge>
                  </div>
                  {analysis.failureMessage ? (
                    <p className="mt-2 text-sm text-muted">{analysis.failureMessage}</p>
                  ) : null}
                  {analysis.findings.map((finding) => (
                    <article key={finding.findingType} className="mt-3 grid gap-2">
                      <p className="text-sm leading-6 text-foreground">{finding.description}</p>
                      <Badge tone={finding.interpretation === 'confirmed-observation' ? 'success' : 'warning'}>
                        {finding.interpretation === 'confirmed-observation' ? 'Observación confirmada' : 'Requiere revisión'}
                      </Badge>
                      <p className="text-sm text-muted">{interpretationLabel(finding.interpretation)}</p>
                      <ul className="grid gap-1 text-sm text-foreground">
                        {findingLines(finding).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                      <ul className="grid gap-1 text-sm text-muted">
                        {finding.evidence.map((item) => (
                          <li key={`${item.label}-${item.measuredAt ?? item.periodStart ?? item.value}`}>
                            {evidenceLine(item)}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </section>
  )
}
