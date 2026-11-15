import type { AssignedSpecialist, PostSaleRequestDetail } from './request-contract.ts'
import { formatInstant } from '../../shared/lib/date-time.ts'
import { formatEvaluationPeriod, statusLabel, typeLabel } from './request-list.ts'

export type DetailField = {
  label: string
  value: string
}

export function detailFields(request: PostSaleRequestDetail): DetailField[] {
  const fields: DetailField[] = [
    { label: 'Cliente', value: request.customerName },
    { label: 'Identificador de cliente', value: request.customerId },
    { label: 'Instalación', value: request.facilityName },
  ]
  if (request.assetId) {
    fields.push({ label: 'Activo', value: request.assetId })
  }
  fields.push(
    { label: 'Tipo de solicitud', value: typeLabel(request.type) },
    { label: 'Periodo de evaluación', value: formatEvaluationPeriod(request.periodStart, request.periodEnd) },
    { label: 'Especialista asignado', value: assignedSpecialistLabel(request.assignedSpecialist) },
    { label: 'Creada', value: formatCreatedAt(request.createdAt) },
  )
  return fields
}

export function assignedSpecialistLabel(specialist: AssignedSpecialist | null) {
  if (!specialist) return 'Sin asignar'
  const name = [specialist.firstName, specialist.lastName]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join(' ')
  return name || 'Nombre no disponible'
}

export function detailStatusLabel(request: Pick<PostSaleRequestDetail, 'status'>) {
  return statusLabel(request.status)
}

export function formatCreatedAt(value: string) {
  return formatInstant(value)
}

export function detailFailureCopy(status: number | null) {
  if (status === 404) {
    return {
      title: 'Solicitud no disponible',
      message: 'No existe una solicitud con ese identificador o no está asignada a su usuario.',
      retry: false,
    }
  }
  if (status === 403) {
    return { title: 'Sin autorización', message: 'No tiene permiso para consultar solicitudes.', retry: false }
  }
  if (status === null) {
    return { title: 'Sin conexión', message: 'No fue posible conectar con el servicio. Inténtelo de nuevo.', retry: true }
  }
  return { title: 'No fue posible abrir la solicitud', message: 'Inténtelo de nuevo.', retry: true }
}
