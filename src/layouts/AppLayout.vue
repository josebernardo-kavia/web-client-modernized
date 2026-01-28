<template>
  <div class="shell">
    <NavBar />
    <div class="body">
      <SideMenu />
      <main class="content" role="main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import SideMenu from '@/components/SideMenu.vue'
</script>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--color-surface);
}

.body {
  display: grid;
  grid-template-columns: var(--side-w) 1fr;
  min-height: calc(100vh - var(--nav-h));
}

.content {
  padding: 18px;
}
</style>
