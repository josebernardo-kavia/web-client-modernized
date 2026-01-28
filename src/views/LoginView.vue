<template>
  <section class="wrap">
    <div class="panel card">
      <h1 class="page-title">Login</h1>
      <p class="muted">
        Placeholder login. For now, click “Set demo token” to pass the route guard.
      </p>

      <div class="row">
        <button class="primary" type="button" @click="setDemoToken">Set demo token</button>
        <button class="btn" type="button" @click="clearToken">Clear</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

function setDemoToken() {
  auth.setToken('demo-token')
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
  router.replace(redirect)
}

function clearToken() {
  auth.setToken(null)
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
  max-width: 520px;
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
</style>
