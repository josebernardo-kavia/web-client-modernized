import { defineStore } from 'pinia'
import { getSessionPreferredStorage } from '@/services/tokenStorage'
import { authService, type OidcTokens } from '@/services/authService'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  username: string | null
}

const storage = getSessionPreferredStorage()

const ACCESS_KEY = 'auth.accessToken'
const REFRESH_KEY = 'auth.refreshToken'
const EXPIRES_KEY = 'auth.expiresAt'
const USER_KEY = 'auth.username'

function loadString(key: string): string | null {
  const v = storage.getItem(key)
  return v && v.length > 0 ? v : null
}

function loadNumber(key: string): number | null {
  const v = storage.getItem(key)
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// PUBLIC_INTERFACE
export const useAuthStore = defineStore('auth', {
  /** Authentication store holding OIDC access/refresh tokens (sessionStorage + in-memory fallback). */
  state: (): AuthState => ({
    accessToken: loadString(ACCESS_KEY),
    refreshToken: loadString(REFRESH_KEY),
    expiresAt: loadNumber(EXPIRES_KEY),
    username: loadString(USER_KEY)
  }),
  getters: {
    // Backwards-compat for existing code paths that read `auth.token`
    token: (state) => state.accessToken,
    isAuthenticated: (state) => Boolean(state.accessToken),
    isAccessTokenExpired: (state) => {
      if (!state.accessToken) return true
      if (!state.expiresAt) return false // If unknown, assume ok; API 401 will trigger refresh attempt.
      return Date.now() >= state.expiresAt
    }
  },
  actions: {
    // PUBLIC_INTERFACE
    setTokens(tokens: OidcTokens) {
      /** Persist tokens in store + session storage. */
      this.accessToken = tokens.accessToken
      this.refreshToken = tokens.refreshToken ?? null
      this.expiresAt = tokens.expiresAt

      const user = authService.getUserInfoFromAccessToken(tokens.accessToken)
      this.username = user.username ?? null

      storage.setItem(ACCESS_KEY, this.accessToken)
      if (this.refreshToken) storage.setItem(REFRESH_KEY, this.refreshToken)
      else storage.removeItem(REFRESH_KEY)

      storage.setItem(EXPIRES_KEY, String(this.expiresAt))
      if (this.username) storage.setItem(USER_KEY, this.username)
      else storage.removeItem(USER_KEY)
    },

    // PUBLIC_INTERFACE
    clearTokens() {
      /** Clears tokens from store + storage. */
      this.accessToken = null
      this.refreshToken = null
      this.expiresAt = null
      this.username = null

      storage.removeItem(ACCESS_KEY)
      storage.removeItem(REFRESH_KEY)
      storage.removeItem(EXPIRES_KEY)
      storage.removeItem(USER_KEY)
    },

    // PUBLIC_INTERFACE
    async tryRefresh(): Promise<boolean> {
      /**
       * Attempts to refresh using refresh token. Returns true if refreshed, false otherwise.
       * Does not throw (callers can treat a refresh failure as a signal to redirect to login).
       */
      if (!this.refreshToken) return false
      try {
        const newTokens = await authService.refreshTokens({ refreshToken: this.refreshToken })
        // Keycloak may rotate refresh tokens; always persist the returned refresh token if present.
        this.setTokens(newTokens)
        return true
      } catch {
        this.clearTokens()
        return false
      }
    },

    // PUBLIC_INTERFACE
    logout() {
      /** Clear auth state and redirect to /login. */
      this.clearTokens()
      // Keep store decoupled from router import cycles by using location navigation.
      window.location.assign('/login')
    }
  }
})
