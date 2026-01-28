import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'

function resolveApiBase(): string {
  const base = import.meta.env.VITE_API_BASE
  // Default to relative /api if not configured; helps local proxy setups.
  return (base && base.trim().length > 0 ? base : '/api').replace(/\+$/, '').replace(/\/+$/, '')
}

// PUBLIC_INTERFACE
export const apiClient = axios.create({
  /** Axios client for REST API access. Base URL comes from VITE_API_BASE. */
  baseURL: resolveApiBase(),
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use(async (config) => {
  const auth = useAuthStore()

  // If we know token is expired and we have a refresh token, refresh proactively.
  if (auth.isAuthenticated && auth.isAccessTokenExpired && auth.refreshToken) {
    await auth.tryRefresh()
  }

  if (auth.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

type RetryableRequestConfig = AxiosRequestConfig & { _retried?: boolean }

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const auth = useAuthStore()
    const status = error.response?.status
    const config = (error.config ?? {}) as RetryableRequestConfig

    // If unauthorized, attempt a single refresh then retry original request.
    if (status === 401 && !config._retried) {
      config._retried = true

      const refreshed = await auth.tryRefresh()
      if (refreshed && auth.token) {
        config.headers = config.headers ?? {}
        ;(config.headers as any).Authorization = `Bearer ${auth.token}`
        return apiClient.request(config)
      }

      // Refresh failed - redirect to login. Preserve current URL for after-login redirect.
      const currentPath = window.location.pathname + window.location.search + window.location.hash
      window.location.assign(`/login?redirect=${encodeURIComponent(currentPath)}`)
    }

    return Promise.reject(error)
  }
)
