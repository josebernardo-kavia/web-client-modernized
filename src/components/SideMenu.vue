<template>
  <aside class="side" aria-label="Primary">
    <nav class="menu">
      <RouterLink class="item" :class="{ active: isActive('home') }" :to="{ name: 'home' }">
        Home
      </RouterLink>
      <RouterLink
        class="item"
        :class="{ active: isActive('projects') }"
        :to="{ name: 'projects' }"
      >
        Projects
      </RouterLink>
      <RouterLink class="item" :class="{ active: isActive('tasks') }" :to="{ name: 'tasks' }">
        Tasks
      </RouterLink>
      <RouterLink
        class="item"
        :class="{ active: isActive('vulnerabilities') }"
        :to="{ name: 'vulnerabilities' }"
      >
        Vulnerabilities
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()

function isActive(name: string) {
  return route.name === name
}
</script>

<style scoped>
.side {
  border-right: 1px solid var(--color-border);
  background: var(--color-bg);
  padding: 14px 10px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item {
  padding: 10px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
}

.item:hover {
  background: var(--color-primary-weak);
  border-color: #d2e4f7;
}

.active {
  background: var(--color-primary-weak);
  border-color: #c3dbf5;
  font-weight: 650;
}
</style>
