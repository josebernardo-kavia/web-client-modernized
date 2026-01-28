import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import TasksView from '@/views/TasksView.vue'
import VulnerabilitiesView from '@/views/VulnerabilitiesView.vue'
import LoginView from '@/views/LoginView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: HomeView },
      { path: 'projects', name: 'projects', component: ProjectsView },
      { path: 'tasks', name: 'tasks', component: TasksView },
      { path: 'vulnerabilities', name: 'vulnerabilities', component: VulnerabilitiesView }
    ]
  }
]

// PUBLIC_INTERFACE
export const router = createRouter({
  /** Application router (history mode). Includes a placeholder auth guard for protected routes. */
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  // Public routes bypass auth check.
  if (to.meta.public) return true

  // Placeholder protection: if not authenticated, redirect to login.
  // Later this will be expanded to validate bearer tokens, refresh, and role-based access.
  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})
