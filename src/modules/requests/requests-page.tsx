import { useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { requestDetailPath } from '@/modules/requests/request-access.ts'
import {
  canGoToNextPage,
  canGoToPreviousPage,
  formatEvaluationPeriod,
  listFailureCopy,
  listMessage,
  listMessageCopy,
  readRequestFilters,
  requestFiltersAreActive,
  requestListParams,
  sameRequestFilters,
  requestStatusTone,
  statusLabel,
  statusOptions,
  typeLabel,
  visibleRequestCountLabel,
  type RequestFilters,
} from '@/modules/requests/request-list.ts'
import { listPostSaleRequests } from '@/modules/requests/requests-api.ts'
import type { PostSaleRequest, PostSaleRequestPage } from '@/modules/requests/request-contract.ts'
import { ApiError, isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'
import { Spinner } from '@/shared/components/ui/spinner.tsx'

const fieldClass =
  'h-12 w-full rounded-md border border-border bg-surface px-3 text-base text-foreground outline-none hover:border-border-strong focus-visible:border-energy-text focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:ring-offset-2 focus-visible:ring-offset-background'

type RequestState = RequestFilters & { attempt: number }
type ListSnapshot = { key: string; page: PostSaleRequestPage | null; error: ApiError | null }

function requestKey(state: RequestState) {
  return [state.search, state.status, String(state.page), String(state.attempt)].join('\u0000')
}

export function RequestsPage() {
  const [params, setParams] = useSearchParams()
  const filters = readRequestFilters(params)
  const [draftSearch, setDraftSearch] = useState(filters.search)
  const [request, setRequest] = useState<RequestState>(() => ({ ...filters, attempt: 0 }))
  const [snapshot, setSnapshot] = useState<ListSnapshot | null>(null)
  const key = requestKey(request)
  const pending = snapshot?.key !== key
  const loading = snapshot === null
  const refreshing = snapshot !== null && pending
  const page = snapshot?.page ?? null
  const error = pending ? null : (snapshot?.error ?? null)
  const searchId = useId()
  const statusId = useId()

  if (!sameRequestFilters(request, filters)) {
    setRequest({ ...filters, attempt: 0 })
  }

  useEffect(() => {
    document.title = `Solicitudes postventa · ${appName()}`
  }, [])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const value = draftSearch.trim()
      setParams((current) => {
        if ((current.get('search') ?? '') === value) return current
        const next = new URLSearchParams(current)
        if (value) next.set('search', value)
        else next.delete('search')
        next.delete('page')
        return next
      }, { replace: true })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draftSearch, setParams])

  useEffect(() => {
    const controller = new AbortController()
    const keyAtStart = requestKey(request)
    listPostSaleRequests(requestListParams(request), controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setSnapshot({ key: keyAtStart, page: result, error: null })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setSnapshot((current) => ({
          key: keyAtStart,
          page: current?.page ?? null,
          error: toApiError(cause),
        }))
      })
    return () => controller.abort()
  }, [request])

  function updateStatus(value: string) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set('status', value)
      else next.delete('status')
      next.delete('page')
      return next
    }, { replace: true })
  }

  function clearSearch() {
    setDraftSearch('')
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('search')
      next.delete('page')
      return next
    }, { replace: true })
  }

  function goToPage(pageNumber: number) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (pageNumber <= 1) next.delete('page')
      else next.set('page', String(pageNumber))
      return next
    }, { replace: true })
  }

  const items = page?.items ?? []
  const filtered = requestFiltersAreActive(filters)
  const message = page ? listMessage({ total: page.total, filtered }) : null
  const failure = error ? listFailureCopy(error.status) : null
  const showPager = page ? canGoToPreviousPage(page.page) || canGoToNextPage(page.page, page.pageSize, page.total) : false

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance">Solicitudes postventa</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Consulta y seguimiento de solicitudes técnicas asignadas.
        </p>
        {page ? (
          <p className="mt-4 text-sm font-semibold text-foreground" aria-live="polite">
            {visibleRequestCountLabel(page.total)}
          </p>
        ) : null}
      </header>

      <form
        className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(12rem,0.8fr)] md:items-end"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="min-w-0">
          <Label htmlFor={searchId}>Buscar</Label>
          <div className="mt-2 flex gap-2">
            <Input
              id={searchId}
              value={draftSearch}
              placeholder="Ticket, cliente o instalación"
              autoComplete="off"
              onChange={(event) => setDraftSearch(event.target.value)}
            />
            {draftSearch ? (
              <Button type="button" variant="secondary" className="shrink-0 px-4" onClick={clearSearch}>
                Limpiar
              </Button>
            ) : null}
          </div>
        </div>
        <div className="min-w-0">
          <Label htmlFor={statusId}>Estado</Label>
          <select
            id={statusId}
            className={`${fieldClass} mt-2`}
            value={filters.status}
            onChange={(event) => updateStatus(event.target.value)}
          >
            <option value="">Todos</option>
            {statusOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      {refreshing ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-muted" role="status">
          <Spinner />
          Actualizando el listado
        </p>
      ) : null}

      {loading ? <RequestSkeleton /> : null}

      {!loading && failure && !page ? (
        <ListFailure
          title={failure.title}
          message={error?.message ?? 'No fue posible completar la solicitud.'}
          retry={failure.retry}
          onRetry={() => setRequest((current) => ({ ...current, attempt: current.attempt + 1 }))}
        />
      ) : null}

      {!loading && page && message ? (
        <section aria-busy={refreshing} className="min-w-0">
          {failure && error ? (
            <div className="mb-4">
              <ListFailure
                title={failure.title}
                message={error.message}
                retry={failure.retry}
                onRetry={() => setRequest((current) => ({ ...current, attempt: current.attempt + 1 }))}
              />
            </div>
          ) : null}
          {message !== 'ready' ? (
            <p className="border-y border-line py-10 text-sm leading-6 text-muted">{listMessageCopy(message)}</p>
          ) : items.length === 0 ? (
            <p className="border-y border-line py-10 text-sm leading-6 text-muted">No hay solicitudes en esta página.</p>
          ) : (
            <RequestResults items={items} />
          )}
          {showPager ? (
            <nav aria-label="Páginas de solicitudes" className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canGoToPreviousPage(page.page) || refreshing}
                onClick={() => goToPage(page.page - 1)}
              >
                Anterior
              </Button>
              <p className="px-2 text-sm text-muted">
                Página {page.page}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canGoToNextPage(page.page, page.pageSize, page.total) || refreshing}
                onClick={() => goToPage(page.page + 1)}
              >
                Siguiente
              </Button>
            </nav>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

function RequestResults({ items }: { items: PostSaleRequest[] }) {
  return (
    <>
      <div className="hidden min-w-0 overflow-x-auto md:block">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="sr-only">Solicitudes postventa visibles</caption>
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-muted">
              <th scope="col" className="px-3 py-3 font-semibold">Ticket</th>
              <th scope="col" className="px-3 py-3 font-semibold">Cliente</th>
              <th scope="col" className="px-3 py-3 font-semibold">Instalación</th>
              <th scope="col" className="px-3 py-3 font-semibold">Tipo</th>
              <th scope="col" className="px-3 py-3 font-semibold">Periodo</th>
              <th scope="col" className="px-3 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-3 py-3 font-semibold">Asignación</th>
              <th scope="col" className="px-3 py-3 font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line align-top">
                <th scope="row" className="px-3 py-4 text-sm font-semibold text-foreground">
                  {item.ticketCode}
                </th>
                <td className="px-3 py-4 text-sm text-foreground">{item.customerName}</td>
                <td className="px-3 py-4 text-sm text-muted">{item.facilityName}</td>
                <td className="px-3 py-4 text-sm text-muted">{typeLabel(item.type)}</td>
                <td className="px-3 py-4 text-sm text-muted">{formatEvaluationPeriod(item.periodStart, item.periodEnd)}</td>
                <td className="px-3 py-4"><StatusBadge status={item.status} /></td>
                <td className="px-3 py-4 text-sm text-muted">{item.assignedSpecialistSub ? 'Asignada' : 'Sin asignar'}</td>
                <td className="px-3 py-4"><DetailLink id={item.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-line border-y border-line md:hidden">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold">{item.ticketCode}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="text-sm text-foreground">{item.customerName}</p>
            <p className="text-sm text-muted">{item.facilityName}</p>
            <p className="text-sm text-muted">{typeLabel(item.type)}</p>
            <p className="text-sm text-muted">{formatEvaluationPeriod(item.periodStart, item.periodEnd)}</p>
            <p className="text-sm text-muted">{item.assignedSpecialistSub ? 'Asignada' : 'Sin asignar'}</p>
            <DetailLink id={item.id} />
          </li>
        ))}
      </ul>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <Badge tone={requestStatusTone(status)}>{statusLabel(status)}</Badge>
}

function DetailLink({ id }: { id: string }) {
  return (
    <Link
      to={requestDetailPath(id)}
      className="inline-flex h-10 items-center text-sm font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4 focus-visible:ring-2 focus-visible:ring-energy-text focus-visible:outline-none"
    >
      Ver detalle
    </Link>
  )
}

function RequestSkeleton() {
  return (
    <div role="status" aria-busy="true" className="grid gap-3">
      <p className="text-sm font-semibold text-muted">Cargando solicitudes</p>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-sunken motion-reduce:animate-none" />
      ))}
    </div>
  )
}

function ListFailure({
  title,
  message,
  retry,
  onRetry,
}: {
  title: string
  message: string
  retry: boolean
  onRetry: () => void
}) {
  return (
    <div className="grid max-w-xl gap-4">
      <Alert tone="error" title={title}>
        {message}
      </Alert>
      {retry ? (
        <Button type="button" variant="secondary" className="w-fit" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}
