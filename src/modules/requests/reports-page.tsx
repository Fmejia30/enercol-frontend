import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { appName } from '@/config/env.ts'
import { useAuthorization } from '@/modules/access/use-authorization.ts'
import { reportEditorPath } from '@/modules/requests/request-access.ts'
import { reportPdfDocument } from '@/modules/requests/report-pdf.ts'
import { downloadReportPdf } from '@/modules/requests/report-pdf-download.ts'
import { listPendingTechnicalReports, listTechnicalReportCatalog, readApprovedTechnicalReport } from '@/modules/requests/requests-api.ts'
import { typeLabel } from '@/modules/requests/request-list.ts'
import { pendingQueueVisible } from '@/modules/requests/report-workflow.ts'
import {
  reportOriginLabel,
  reportStatusLabel,
  reportStatusTone,
  type PendingTechnicalReport,
  type TechnicalReportCatalogItem,
} from '@/modules/requests/technical-report.ts'
import { formatInstant } from '@/shared/lib/date-time.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Badge } from '@/shared/components/ui/badge.tsx'
import { Button } from '@/shared/components/ui/button.tsx'
import { Input } from '@/shared/components/ui/input.tsx'
import { Label } from '@/shared/components/ui/label.tsx'

export function ReportsPage() {
  const authorization = useAuthorization()
  const showQueue = pendingQueueVisible(authorization.hasRole('VALIDATOR'))
  const [items, setItems] = useState<TechnicalReportCatalogItem[] | null>(null)
  const [pending, setPending] = useState<PendingTechnicalReport[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    document.title = `Informes técnicos · ${appName()}`
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const queue = showQueue
      ? listPendingTechnicalReports(controller.signal).then((page) => page.items)
      : Promise.resolve([] as PendingTechnicalReport[])
    Promise.all([listTechnicalReportCatalog(controller.signal), queue])
      .then(([result, waiting]) => {
        if (controller.signal.aborted) return
        setItems(result)
        setPending(waiting)
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(toApiError(cause).message)
        setItems([])
        setPending([])
      })
    return () => controller.abort()
  }, [showQueue])

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    if (!query || !items) return items ?? []
    return items.filter((item) =>
      [item.ticketCode, item.customerName, item.facilityName, item.report.content.title].some((value) =>
        value.toLocaleLowerCase('es').includes(query),
      ),
    )
  }, [items, search])

  async function exportPdf(item: TechnicalReportCatalogItem) {
    setExportingId(item.report.id)
    setExportError(null)
    try {
      const author = item.report.createdBy
        ? `${item.report.createdBy.firstName} ${item.report.createdBy.lastName}`
        : 'Autor no disponible'
      const context = {
        customerName: item.customerName,
        facilityName: item.facilityName,
        author,
      }
      if (item.report.status === 'APPROVED') {
        const approved = await readApprovedTechnicalReport(item.report.requestId, item.report.id)
        const approver = approved.approval.approver
          ? `${approved.approval.approver.firstName} ${approved.approval.approver.lastName}`
          : 'Aprobador no disponible'
        await downloadReportPdf(
          reportPdfDocument(approved.report, context, {
            version: approved.approval.version,
            approvedAt: approved.approval.approvedAt,
            approver,
          }),
          `${item.ticketCode}-v${approved.report.version}-aprobado.pdf`,
        )
      } else {
        await downloadReportPdf(reportPdfDocument(item.report, context), `${item.ticketCode}-v${item.report.version}.pdf`)
      }
    } catch (cause: unknown) {
      setExportError(toApiError(cause).message)
    } finally {
      setExportingId(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
      <header className="border-b border-line pb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Informes técnicos</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Borradores guardados. El PDF corresponde a la versión almacenada.
        </p>
      </header>
      {showQueue ? (
        <section className="grid gap-3" aria-labelledby="pendientes-validacion">
          <h2 id="pendientes-validacion" className="text-sm font-semibold">
            Pendientes de validación
          </h2>
          {pending === null ? <p className="text-sm text-muted">Cargando la cola</p> : null}
          {pending && pending.length === 0 ? <p className="text-sm leading-6 text-muted">No hay informes esperando validación.</p> : null}
          {pending && pending.length > 0 ? (
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <caption className="sr-only">Informes pendientes de validación</caption>
                <thead>
                  <tr className="border-b border-line text-xs font-semibold text-muted">
                    <th className="px-3 py-3">Solicitud</th>
                    <th className="px-3 py-3">Informe</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Instalación</th>
                    <th className="px-3 py-3">Versión</th>
                    <th className="px-3 py-3">Enviado</th>
                    <th className="px-3 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((item) => (
                    <tr key={item.reportId} className="border-b border-line align-top">
                      <td className="px-3 py-3 font-semibold">{item.ticketCode}</td>
                      <td className="px-3 py-3">
                        <Link className="font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4" to={reportEditorPath(item.requestId, item.reportId)}>
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{item.customerName}</td>
                      <td className="px-3 py-3 text-muted">{item.facilityName}</td>
                      <td className="px-3 py-3">{item.version}</td>
                      <td className="px-3 py-3 text-muted">
                        {item.submittedAt ? formatInstant(item.submittedAt) : 'Sin fecha'}
                        <span className="block">
                          {item.submittedBy ? `${item.submittedBy.firstName} ${item.submittedBy.lastName}` : 'Autor no disponible'}
                        </span>
                      </td>
                      <td className="px-3 py-3"><Badge tone={reportStatusTone(item.status)}>{reportStatusLabel(item.status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
      <div className="max-w-sm">
        <Label htmlFor="buscar-informes">Buscar</Label>
        <Input id="buscar-informes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ticket, cliente o instalación" />
      </div>
      {items === null ? <p className="text-sm text-muted">Cargando informes</p> : null}
      {error ? <Alert tone="error" title="No fue posible cargar los informes">{error}</Alert> : null}
      {exportError ? <Alert tone="error" title="No fue posible descargar el PDF">{exportError}</Alert> : null}
      {items && visible.length === 0 ? <p className="text-sm leading-6 text-muted">No hay informes para mostrar.</p> : null}
      {visible.length > 0 ? (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <caption className="sr-only">Informes técnicos visibles</caption>
            <thead>
              <tr className="border-b border-line text-xs font-semibold text-muted">
                <th className="px-3 py-3">Informe</th>
                <th className="px-3 py-3">Solicitud</th>
                <th className="px-3 py-3">Cliente</th>
                <th className="px-3 py-3">Instalación</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Versión</th>
                <th className="px-3 py-3">Autor</th>
                <th className="px-3 py-3">Actualizado</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.report.id} className="border-b border-line align-top">
                  <th className="px-3 py-3 font-semibold" scope="row" title={item.report.id}>
                    {item.report.id.slice(0, 8)}
                  </th>
                  <td className="px-3 py-3 font-semibold">{item.ticketCode}</td>
                  <td className="px-3 py-3">{item.customerName}</td>
                  <td className="px-3 py-3 text-muted">{item.facilityName}</td>
                  <td className="px-3 py-3 text-muted">{typeLabel(item.requestType)}</td>
                  <td className="px-3 py-3">{item.report.version}</td>
                  <td className="px-3 py-3 text-muted">
                    {item.report.createdBy ? `${item.report.createdBy.firstName} ${item.report.createdBy.lastName}` : 'Autor no disponible'}
                    <span className="block">{reportOriginLabel(item.report.origin)}</span>
                  </td>
                  <td className="px-3 py-3 text-muted">{formatInstant(item.report.updatedAt)}</td>
                  <td className="px-3 py-3"><Badge tone={reportStatusTone(item.report.status)}>{reportStatusLabel(item.report.status)}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-start gap-2">
                      <Link className="font-semibold text-energy-text underline decoration-energy-text/40 underline-offset-4" to={reportEditorPath(item.report.requestId, item.report.id)}>
                        Abrir
                      </Link>
                      <Button type="button" size="sm" variant="secondary" loading={exportingId === item.report.id} onClick={() => void exportPdf(item)}>
                        PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
