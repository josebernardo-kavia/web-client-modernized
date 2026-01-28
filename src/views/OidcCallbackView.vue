<template>
  <section class="wrap">
    <div class="panel card">
      <h1 class="page-title">Signing you in…</h1>
      <p class="muted">
        Completing login with the identity provider. If this takes too long, please try again.
      </p>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/authService'
import { getSessionPreferredStorage } from '@/services/tokenStorage'

const CODE_VERIFIER_KEY = 'oidc.code_verifier'
const STATE_KEY = 'oidc.state'
const REDIRECT_KEY = 'oidc.post_login_redirect'

const error = ref<string | null>(null)

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const storage = getSessionPreferredStorage()

onMounted(async () => {
  try {
    const code = typeof route.query.code === 'string' ? route.query.code : null
    const state = typeof route.query.state === 'string' ? route.query.state : null

    if (!code) {
      throw new Error('Missing authorization code.')
    }

    const expectedState = storage.getItem(STATE_KEY)
    if (expectedState && state && expectedState !== state) {
      throw new Error('Invalid login state. Please retry login.')
    }

    const verifier = storage.getItem(CODE_VERIFIER_KEY)
    if (!verifier) {
      throw new Error('Missing PKCE verifier. Please retry login.')
    }

    const tokens = await authService.exchangeCodeForTokens({ code, codeVerifier: verifier })
    auth.setTokens(tokens)

    // Cleanup transient values
    storage.removeItem(CODE_VERIFIER_KEY)
    storage.removeItem(STATE_KEY)

    const redirect = storage.getItem(REDIRECT_KEY) || '/'
    storage.removeItem(REDIRECT_KEY)

    router.replace(redirect)
  } catch (e: any) {
    error.value = e?.message ? String(e.message) : 'Login failed.'
    auth.clearTokens()
    // Fall back to login screen after a short delay to allow user to see the error.
    setTimeout(() => router.replace({ name: 'login' }), 1200)
  }
})
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

.error {
  margin-top: 12px;
  color: #b42318;
}
</style>
