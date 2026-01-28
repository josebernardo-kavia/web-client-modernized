<template>
  <section class="wrap">
    <div class="panel card">
      <h1 class="page-title">Login</h1>
      <p class="muted">
        Sign in with your organization account (Keycloak/OIDC). You will be redirected to the identity
        provider.
      </p>

      <div class="row">
        <button class="primary" type="button" @click="startLogin" :disabled="busy">
          {{ busy ? 'Redirecting…' : 'Login' }}
        </button>
        <button class="btn" type="button" @click="clearSession" :disabled="busy">Clear session</button>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <details class="details">
        <summary class="muted">Troubleshooting</summary>
        <div class="muted small">
          <p>
            Ensure the following are set in your environment:
            <code>VITE_OIDC_ISSUER</code>, <code>VITE_OIDC_CLIENT_ID</code>,
            <code>VITE_OIDC_REDIRECT_URI</code>, <code>VITE_OIDC_SCOPE</code>.
          </p>
        </div>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/authService'
import { getSessionPreferredStorage } from '@/services/tokenStorage'

const CODE_VERIFIER_KEY = 'oidc.code_verifier'
const STATE_KEY = 'oidc.state'
const REDIRECT_KEY = 'oidc.post_login_redirect'

const busy = ref(false)
const error = ref<string | null>(null)

const auth = useAuthStore()
const route = useRoute()
const storage = getSessionPreferredStorage()

async function startLogin() {
  try {
    error.value = null
    busy.value = true

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    storage.setItem(REDIRECT_KEY, redirect)

    const { authorizeUrl, codeVerifier, state } = await authService.buildLoginUrl()
    storage.setItem(CODE_VERIFIER_KEY, codeVerifier)
    storage.setItem(STATE_KEY, state)

    window.location.assign(authorizeUrl)
  } catch (e: any) {
    error.value = e?.message ? String(e.message) : 'Unable to start login.'
    busy.value = false
  }
}

function clearSession() {
  auth.clearTokens()
  storage.removeItem(CODE_VERIFIER_KEY)
  storage.removeItem(STATE_KEY)
  storage.removeItem(REDIRECT_KEY)
}
</script>

<style scoped>
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: var(--color-surface);
}

.panel {
  max-width: 560px;
  width: 100%;
}

.row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.primary {
  border: 1px solid #0f5aa5;
  background: var(--color-primary);
  color: white;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.details {
  margin-top: 12px;
}

.small {
  font-size: 12px;
}

.error {
  margin-top: 12px;
  color: #b42318;
}
</style>
