import { formatCalendarDate } from '../../shared/lib/date-time.ts'
import {
  isRequestStatus,
  requestStatuses,
  type PostSaleRequestQuery,
  type RequestStatus,
  type RequestType,
} from './request-contract.ts'

export const requestPageSize = 20

export type RequestFilters = {
  search: string
  status: RequestStatus | ''
  page: number
}

const statusLabels: Record<RequestStatus, string> = {
  RECEIVED: 'Recibida',
  ASSIGNED: 'Asignada',
  IN_ANALYSIS: 'En análisis',
  REPORT_DRAFT: 'Borrador de informe',
  PENDING_VALIDATION: 'Pendiente de validación',
  REPORT_APPROVED: 'Informe aprobado',
  REPORT_CHANGES_REQUESTED: 'Ajustes solicitados',
  REANALYSIS_REQUIRED: 'Reanálisis requerido',
  ABIERTA: 'Abierta',
  EN_ANALISIS: 'En análisis',
  INFORME_EMITIDO: 'Informe emitido',
}

const typeLabels: Record<RequestType, string> = {
  VERIFICACION_DEMANDA: 'Verificación de demanda',
  DESVIACION_FACTOR_POTENCIA: 'Desviación de factor de potencia',
  CONSUMO_ATIPICO: 'Consumo atípico',
  CALIDAD_DE_POTENCIA: 'Calidad de potencia',
}

export function statusLabel(status: string) {
  return isRequestStatus(status) ? statusLabels[status] : status
}

export function requestStatusTone(status: string): 'info' | 'warning' | 'success' | 'neutral' | 'draft' {
  if (status === 'RECEIVED' || status === 'ASSIGNED' || status === 'ABIERTA' || status === 'PENDING_VALIDATION') return 'info'
  if (status === 'IN_ANALYSIS' || status === 'EN_ANALISIS' || status === 'REPORT_CHANGES_REQUESTED' || status === 'REANALYSIS_REQUIRED') {
    return 'warning'
  }
  if (status === 'REPORT_DRAFT') return 'draft'
  if (status === 'REPORT_APPROVED' || status === 'INFORME_EMITIDO') return 'success'
  return 'neutral'
}

export function typeLabel(type: string) {
  return type in typeLabels ? typeLabels[type as RequestType] : type
}

export function statusOptions() {
  return requestStatuses.map((status) => ({ value: status, label: statusLabels[status] }))
}

export function formatEvaluationPeriod(start: string, end: string) {
  return `${formatCalendarDate(start)} – ${formatCalendarDate(end)}`
}

export function visibleRequestCountLabel(total: number) {
  return total === 1 ? '1 solicitud visible' : `${total} solicitudes visibles`
}

export function readRequestFilters(params: URLSearchParams): RequestFilters {
  const status = params.get('status') ?? ''
  const page = Number(params.get('page') ?? '1')
  return {
    search: params.get('search') ?? '',
    status: isRequestStatus(status) ? status : '',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  }
}

export function sameRequestFilters(current: RequestFilters, next: RequestFilters) {
  return current.search === next.search && current.status === next.status && current.page === next.page
}

export function requestListParams(filters: RequestFilters): PostSaleRequestQuery {
  const search = filters.search.trim()
  return {
    page: filters.page,
    pageSize: requestPageSize,
    ...(filters.status ? { status: filters.status } : {}),
    ...(search ? { search } : {}),
  }
}

export function requestFiltersAreActive(filters: Pick<RequestFilters, 'search' | 'status'>) {
  return filters.search.trim().length > 0 || filters.status.length > 0
}

export type ListMessage = 'empty' | 'no-results' | 'ready'

export function listMessage(input: { total: number; filtered: boolean }): ListMessage {
  if (input.total > 0) return 'ready'
  return input.filtered ? 'no-results' : 'empty'
}

export function listMessageCopy(message: ListMessage) {
  if (message === 'empty') return 'No hay solicitudes visibles.'
  if (message === 'no-results') return 'Ninguna solicitud coincide con la búsqueda o el estado.'
  return null
}

export function canGoToPreviousPage(page: number) {
  return page > 1
}

export function canGoToNextPage(page: number, pageSize: number, total: number) {
  return page * pageSize < total
}

export function listFailureCopy(status: number | null) {
  if (status === 403) return { title: 'Sin autorización', retry: false }
  if (status === null) return { title: 'Sin conexión', retry: true }
  return { title: 'No fue posible cargar las solicitudes', retry: true }
}

