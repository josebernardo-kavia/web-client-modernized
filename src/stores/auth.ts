import { defineStore } from 'pinia'

type AuthState = {
  token: string | null
}

// PUBLIC_INTERFACE
export const useAuthStore = defineStore('auth', {
  /** Authentication store holding the current bearer token (placeholder implementation). */
  state: (): AuthState => ({
    token: null
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    // PUBLIC_INTERFACE
    setToken(token: string | null) {
      /** Set or clear the bearer token. In a future step, persist token securely. */
      this.token = token
    },
    // PUBLIC_INTERFACE
    logout() {
      /** Clear auth state. */
      this.token = null
    }
  }
})
