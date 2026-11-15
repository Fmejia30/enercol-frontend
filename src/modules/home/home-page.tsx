import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { areaDescription, greetingForHour, roleLabel, workspaceAreas } from '@/modules/home/dashboard-content.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { useAuth } from '@/modules/auth/use-auth.ts'
import { requestDetailPath } from '@/modules/requests/request-access.ts'
import { listTechnicalAnalysisCatalog, listTechnicalReportCatalog, listPostSaleRequests } from '@/modules/requests/requests-api.ts'
import { statusLabel } from '@/modules/requests/request-list.ts'
import type { PostSaleRequestPage } from '@/modules/requests/request-contract.ts'
import type { TechnicalAnalysisCatalogItem } from '@/modules/requests/technical-analysis.ts'
import type { TechnicalReportCatalogItem } from '@/modules/requests/technical-report.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Badge } from '@/shared/components/ui/badge.tsx'

function currentGreeting() {
  return greetingForHour(new Date().getHours())
}

type WorkSnapshot = {
  requests: PostSaleRequestPage | null
  analyses: TechnicalAnalysisCatalogItem[] | null
  reports: TechnicalReportCatalogItem[] | null
  error: string | null
}

export function HomePage() {
  const { snapshot } = useAuth()
  const authorization = useAuthorization()
  const ready = authorization.status === 'authenticated' && snapshot.status === 'authenticated'
  const roles = ready ? authorization.roles : []
  const areas = ready ? workspaceAreas(authorization) : []
  const [greeting] = useState(currentGreeting)
  const [work, setWork] = useState<WorkSnapshot | null>(null)

  useEffect(() => {
    document.title = `Inicio · ${appName()}`
  }, [])

  const canRequests = ready && authorization.hasPermission('requests:read_assigned')
  const canAnalyses = ready && authorization.hasPermission('analysis:read')
  const canReports = ready && authorization.hasPermission('reports:read')

  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    const requests = canRequests
      ? listPostSaleRequests({ page: 1, pageSize: 20 }, controller.signal)
      : Promise.resolve(null)
    const analyses = canAnalyses
      ? listTechnicalAnalysisCatalog(controller.signal)
      : Promise.resolve(null)
    const reports = canReports
      ? listTechnicalReportCatalog(controller.signal)
      : Promise.resolve(null)
    Promise.all([requests, analyses, reports])
      .then(([requestPage, analysisItems, reportItems]) => {
        if (controller.signal.aborted) return
        setWork({ requests: requestPage, analyses: analysisItems, reports: reportItems, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setWork({ requests: null, analyses: null, reports: null, error: toApiError(cause).message })
      })
    return () => controller.abort()
  }, [ready, canRequests, canAnalyses, canReports])

  const awaitingAnalysis = analysisGap(work)
  const drafts = work?.reports ? new Set(work.reports.map((item) => item.report.requestId)).size : null

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{greeting}.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          El trabajo pendiente sale de las solicitudes, análisis e informes que su usuario puede ver.
        </p>
      </header>
      {ready && roles.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Perfil de acceso">
          {roles.map((role) => (
            <li key={role}><Badge>{roleLabel(role)}</Badge></li>
          ))}
        </ul>
      ) : null}
      {work?.error ? <p className="text-sm text-muted">{work.error}</p> : null}
      <section aria-labelledby="resumen-trabajo" className="grid gap-6 border-b border-line pb-6 sm:grid-cols-3">
        <h2 id="resumen-trabajo" className="sr-only">Resumen</h2>
        <Metric label="Solicitudes en su alcance" value={metricText(work, work?.requests ? String(work.requests.total) : null)} />
        <Metric label="Sin análisis exitoso" value={metricText(work, awaitingAnalysis)} />
        <Metric label="Solicitudes con borrador" value={metricText(work, drafts === null ? null : String(drafts))} />
      </section>
      <p className="text-sm leading-6 text-muted">La revisión formal del informe todavía no está disponible.</p>
      <section aria-labelledby="trabajo-reciente">
        <h2 id="trabajo-reciente" className="text-sm font-semibold">Solicitudes recientes</h2>
        {work?.requests && work.requests.items.length > 0 ? (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {work.requests.items.slice(0, 5).map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <Link to={requestDetailPath(item.id)} className="text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4">
                  {item.ticketCode}
                </Link>
                <span className="text-sm text-muted">{item.customerName}</span>
                <span className="text-sm text-muted">{statusLabel(item.status)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{work ? 'No hay solicitudes recientes.' : 'Cargando el trabajo reciente.'}</p>
        )}
      </section>
      {areas.length > 0 ? (
        <section aria-labelledby="secciones">
          <h2 id="secciones" className="text-sm font-semibold">Secciones</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {areas.map((area) => (
              <li key={area.label}>
                <Link to={area.to ?? '/app'} className="block rounded-md border border-line px-4 py-3 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none">
                  <span className="block text-sm font-semibold">{area.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted">{areaDescription(area.label)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <h3 className="text-sm text-muted">{label}</h3>
      <p className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  )
}

function metricText(work: WorkSnapshot | null, value: string | null) {
  if (!work) return 'Cargando'
  return value ?? 'No disponible'
}

function analysisGap(work: WorkSnapshot | null) {
  if (!work?.requests || !work.analyses) return null
  if (work.requests.total !== work.requests.items.length) return null
  const covered = new Set(
    work.analyses.filter((item) => item.status === 'SUCCEEDED').map((item) => item.requestId),
  )
  return String(work.requests.items.filter((item) => !covered.has(item.id)).length)
}
