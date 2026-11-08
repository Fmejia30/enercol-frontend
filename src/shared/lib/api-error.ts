import axios from 'axios'

export class ApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isAbortError(error: unknown) {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError(error)) {
    return new ApiError('No fue posible completar la solicitud.', null)
  }
  if (error.code === 'ERR_INVALID_URL') {
    return new ApiError('Falta configurar VITE_API_BASE_URL.', null)
  }
  if (error.code === 'ECONNABORTED') {
    return new ApiError('La solicitud tardó demasiado. Inténtelo de nuevo.', null)
  }
  if (!error.response) {
    return new ApiError('No fue posible conectar con el servicio. Inténtelo de nuevo.', null)
  }

  const status = error.response.status
  return new ApiError(messageFromBody(error.response.data, status), status)
}

function messageFromBody(data: unknown, status: number) {
  if (isRecord(data)) {
    const message = data.message
    if (typeof message === 'string' && message.trim()) return message
    if (Array.isArray(message)) {
      const lines = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      if (lines.length > 0) return lines.join(' ')
    }
  }

  if (status === 401) return 'No fue posible iniciar sesión'
  if (status === 403) return 'No fue posible validar la solicitud'
  if (status === 429) return 'Demasiados intentos. Inténtelo más tarde.'
  if (status === 503) return 'No fue posible completar la autenticación. Inténtelo más tarde.'
  return 'No fue posible completar la solicitud.'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
