import { z } from 'zod'
import { ApiError } from '../../shared/lib/api-error.ts'

export const requestStatuses = [
  'RECEIVED',
  'ASSIGNED',
  'IN_ANALYSIS',
  'REPORT_DRAFT',
  'PENDING_VALIDATION',
  'REPORT_APPROVED',
  'REPORT_CHANGES_REQUESTED',
  'REANALYSIS_REQUIRED',
  'ABIERTA',
  'EN_ANALISIS',
  'INFORME_EMITIDO',
] as const
export const requestTypes = [
  'VERIFICACION_DEMANDA',
  'DESVIACION_FACTOR_POTENCIA',
  'CONSUMO_ATIPICO',
  'CALIDAD_DE_POTENCIA',
] as const

export type RequestStatus = (typeof requestStatuses)[number]
export type RequestType = (typeof requestTypes)[number]

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const requestFields = {
  id: z.string().min(1),
  ticketCode: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  facilityName: z.string().min(1),
  assetId: z.string().min(1).nullable(),
  type: z.enum(requestTypes),
  description: z.string().min(1),
  periodStart: dateOnly,
  periodEnd: dateOnly,
  status: z.enum(requestStatuses),
  createdAt: z.string().min(1),
}

const specialistSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
})

const requestSchema = z.object({
  ...requestFields,
  assignedSpecialistSub: z.string().min(1).nullable(),
})

const detailSchema = z.object({
  ...requestFields,
  assignedSpecialist: specialistSchema.nullable(),
})

const pageSchema = z.object({
  items: z.array(requestSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

export type PostSaleRequest = z.infer<typeof requestSchema>
export type PostSaleRequestDetail = z.infer<typeof detailSchema>
export type AssignedSpecialist = z.infer<typeof specialistSchema>
export type PostSaleRequestPage = z.infer<typeof pageSchema>

export type PostSaleRequestQuery = {
  page: number
  pageSize: number
  status?: RequestStatus
  search?: string
}

export function parsePostSaleRequest(data: unknown): PostSaleRequest {
  return parse(requestSchema, data)
}

export function parsePostSaleRequestDetail(data: unknown): PostSaleRequestDetail {
  return parse(detailSchema, data)
}

export function parsePostSaleRequestPage(data: unknown): PostSaleRequestPage {
  return parse(pageSchema, data)
}

export function isRequestStatus(value: string): value is RequestStatus {
  return requestStatuses.some((status) => status === value)
}

export function postSaleRequestPath(id: string) {
  return `/post-sale-requests/${encodeURIComponent(id)}`
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.', null)
  }
  return result.data
}
