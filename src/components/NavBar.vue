<template>
  <header class="nav" role="banner">
    <div class="left">
      <div class="brand">Security Ops</div>
      <div class="tag muted">Modernized</div>
    </div>

    <div class="right">
      <span class="muted api">
        API:
        <strong>{{ apiBaseLabel }}</strong>
      </span>

      <button class="btn" type="button" @click="onLogout" :disabled="!auth.isAuthenticated">
        Logout
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const apiBaseLabel = computed(() => {
  const base = import.meta.env.VITE_API_BASE
  return base && base.trim().length > 0 ? base : '/api (default)'
})

function onLogout() {
  auth.logout()
}
</script>

<style scoped>
.nav {
  height: var(--nav-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 10;
}

.left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.brand {
  font-weight: 750;
  letter-spacing: 0.2px;
}

.tag {
  font-size: 12px;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api {
  font-size: 12px;
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
