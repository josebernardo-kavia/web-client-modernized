import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

function resolveApiBase(): string {
  const base = import.meta.env.VITE_API_BASE
  // Default to relative /api if not configured; helps local proxy setups.
  return (base && base.trim().length > 0 ? base : '/api').replace(/\/+$/, '')
}

// PUBLIC_INTERFACE
export const apiClient = axios.create({
  /** Axios client for REST API access. Base URL comes from VITE_API_BASE. */
  baseURL: resolveApiBase(),
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})
