import axios from 'axios'
import { toApiError } from '@/shared/lib/api-error.ts'
import { getCsrfToken, notifyUnauthorized } from '@/shared/lib/csrf.ts'

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')

export const api = axios.create({
  baseURL: baseURL || undefined,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (!baseURL) {
    throw new axios.AxiosError('Falta VITE_API_BASE_URL.', 'ERR_INVALID_URL', config)
  }
  const token = getCsrfToken()
  if (token) config.headers.set('X-CSRF-Token', token)
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const url = axios.isAxiosError(error) ? error.config?.url : undefined
    if (apiError.status === 401 && url && !isSignInAttempt(url)) {
      notifyUnauthorized(apiError.message)
    }
    return Promise.reject(error)
  },
)

function isSignInAttempt(url: string) {
  return url.includes('/auth/login') || url.includes('/auth/challenge')
}
