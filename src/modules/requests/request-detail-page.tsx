import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { requestsPath } from '@/modules/requests/request-access.ts'
import { detailFailureCopy, detailFields, detailStatusLabel } from '@/modules/requests/request-detail.ts'
import { RequestActivitySection } from '@/modules/requests/request-activity-section.tsx'
import { RequestReportSection } from '@/modules/requests/request-report-section.tsx'
import { RequestTechnicalSection } from '@/modules/requests/request-technical-section.tsx'
import type { PostSaleRequestDetail } from '@/modules/requests/request-contract.ts'
import { readPostSaleRequest } from '@/modules/requests/requests-api.ts'
import { isAbortError, toApiError, type ApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { requestStatusTone } from '@/modules/requests/request-list.ts'

type DetailSnapshot = { key: string; request: PostSaleRequestDetail | null; error: ApiError | null }

export function RequestDetailPage() {
  const { requestId = '' } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<DetailSnapshot | null>(null)
  const key = `${requestId}\u0000${attempt}`
  const current = snapshot?.key === key ? snapshot : null
  const loading = current === null
  const request = current?.request ?? null
  const error = current?.error ?? null

  useEffect(() => {
    document.title = `${request?.ticketCode ?? 'Solicitud'} · ${appName()}`
  }, [request?.ticketCode])

  useEffect(() => {
    const controller = new AbortController()
    const keyAtStart = `${requestId}\u0000${attempt}`
    readPostSaleRequest(requestId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setSnapshot({ key: keyAtStart, request: result, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot({ key: keyAtStart, request: null, error: toApiError(cause) })
      })
    return () => controller.abort()
  }, [requestId, attempt])

  const failure = error ? detailFailureCopy(error.status) : null

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8">
      <div>
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to={requestsPath}
            className="font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
          >
            Solicitudes postventa
          </Link>
          <span aria-hidden="true" className="text-subtle">/</span>
          <span className="text-muted">{request?.ticketCode ?? 'Detalle'}</span>
        </nav>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            {request?.ticketCode ?? 'Solicitud postventa'}
          </h1>
          {request ? (
            <Badge tone={requestStatusTone(request.status)}>{detailStatusLabel(request)}</Badge>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div role="status" aria-busy="true" className="grid gap-3">
          <p className="text-sm font-semibold text-muted">Cargando solicitud</p>
          <div className="h-40 animate-pulse rounded-md bg-sunken motion-reduce:animate-none" />
        </div>
      ) : null}

      {!loading && failure ? (
        <div className="grid max-w-xl gap-4">
          <Alert tone="error" title={failure.title}>
            {failure.message}
          </Alert>
          <div className="flex flex-wrap gap-3">
            {failure.retry ? (
              <Button type="button" variant="secondary" className="w-fit" onClick={() => setAttempt((value) => value + 1)}>
                Reintentar
              </Button>
            ) : null}
            <Link
              to={requestsPath}
              className="inline-flex h-12 items-center text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && request ? (
        <>
          <DetailGroups request={request} />

          <section aria-labelledby="descripcion-solicitud">
            <h2 id="descripcion-solicitud" className="text-sm font-semibold">
              Descripción
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground">{request.description}</p>
          </section>

          <RequestTechnicalSection requestId={request.id} />

          <RequestReportSection requestId={request.id} />

          <RequestActivitySection requestId={request.id} />

          <Link
            to={requestsPath}
            className="w-fit text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
          >
            Volver al listado
          </Link>
        </>
      ) : null}
    </div>
  )
}

const detailGroups = [
  { title: 'Identificación', labels: ['Tipo de solicitud', 'Creada'] },
  { title: 'Cliente e instalación', labels: ['Cliente', 'Identificador de cliente', 'Instalación', 'Activo'] },
  { title: 'Periodo de evaluación', labels: ['Periodo de evaluación'] },
  { title: 'Asignación', labels: ['Especialista asignado'] },
] as const

function DetailGroups({ request }: { request: PostSaleRequestDetail }) {
  const fields = detailFields(request)
  return (
    <div className="grid gap-6">
      {detailGroups.map((group) => {
        const items = fields.filter((field) => (group.labels as readonly string[]).includes(field.label))
        if (items.length === 0) return null
        return (
          <section key={group.title} className="border-t border-line pt-4">
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <dl className="mt-2">
              {items.map((field) => (
                <div key={field.label} className="grid gap-1 py-2 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-sm font-semibold text-muted">{field.label}</dt>
                  <dd className="text-sm break-words text-foreground">{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </div>
  )
}
