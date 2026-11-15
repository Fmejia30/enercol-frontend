import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { requestDetailPath } from '@/modules/requests/request-access.ts'
import { listTechnicalAnalysisCatalog } from '@/modules/requests/requests-api.ts'
import { typeLabel } from '@/modules/requests/request-list.ts'
import { analysisStatusLabel, executedAtLabel, type TechnicalAnalysisCatalogItem } from '@/modules/requests/technical-analysis.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

export function AnalysesPage() {
  const [items, setItems] = useState<TechnicalAnalysisCatalogItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    document.title = `Análisis técnicos · ${appName()}`
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    listTechnicalAnalysisCatalog(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setItems(result)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(toApiError(cause).message)
        setItems([])
      })
    return () => controller.abort()
  }, [attempt])

  const visible = useMemo(() => filterWork(items ?? [], search), [items, search])

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
      <header className="border-b border-line pb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Análisis técnicos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Ejecuciones ya registradas. Desde aquí se consulta el resultado y se vuelve a la solicitud.
        </p>
      </header>
      <div className="max-w-sm">
        <Label htmlFor="buscar-analisis">Buscar</Label>
        <Input id="buscar-analisis" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ticket, cliente o instalación" />
      </div>
      {items === null ? <p className="text-sm text-muted">Cargando análisis</p> : null}
      {error ? <Alert tone="error" title="No fue posible cargar los análisis">{error}</Alert> : null}
      {items && visible.length === 0 ? (
        <p className="text-sm leading-6 text-muted">No hay análisis para mostrar.</p>
      ) : null}
      {visible.length > 0 ? (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <caption className="sr-only">Análisis técnicos visibles</caption>
            <thead>
              <tr className="border-b border-line text-xs font-semibold text-muted">
                <th className="px-3 py-3">Solicitud</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Instalación</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Ejecución</th>
                <th className="px-3 py-3">Hallazgo</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className="border-b border-line align-top">
                  <th className="px-3 py-3 font-semibold" scope="row">
                    <Link className="text-energy-text underline decoration-energy-text/40 underline-offset-4" to={requestDetailPath(item.requestId)}>
                      {item.ticketCode}
                    </Link>
                  </th>
                  <td className="px-3 py-3">{item.customerName}</td>
                  <td className="px-3 py-3 text-muted">{item.facilityName}</td>
                  <td className="px-3 py-3 text-muted">{typeLabel(item.requestType)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={item.status === 'SUCCEEDED' ? 'success' : 'danger'}>{analysisStatusLabel(item.status)}</Badge>
                  </td>
                  <td className="px-3 py-3 text-muted">{executedAtLabel(item.executedAt)}</td>
                  <td className="px-3 py-3 text-muted">{item.findings[0]?.description ?? item.failureMessage ?? 'Sin hallazgo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {error ? (
        <button type="button" className="w-fit text-sm font-semibold text-energy-text" onClick={() => { setError(null); setItems(null); setAttempt((value) => value + 1) }}>
          Reintentar
        </button>
      ) : null}
    </div>
  )
}

function filterWork(items: TechnicalAnalysisCatalogItem[], search: string) {
  const query = search.trim().toLocaleLowerCase('es')
  if (!query) return items
  return items.filter((item) =>
    [item.ticketCode, item.customerName, item.facilityName].some((value) => value.toLocaleLowerCase('es').includes(query)),
  )
}
