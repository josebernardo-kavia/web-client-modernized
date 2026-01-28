import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import AppLayout from '@/layouts/AppLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import TasksView from '@/views/TasksView.vue'
import VulnerabilitiesView from '@/views/VulnerabilitiesView.vue'
import ProjectDetailView from '@/views/ProjectDetailView.vue'
import TaskDetailView from '@/views/TaskDetailView.vue'
import VulnerabilityDetailView from '@/views/VulnerabilityDetailView.vue'
import LoginView from '@/views/LoginView.vue'
import OidcCallbackView from '@/views/OidcCallbackView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/oidc/callback',
    name: 'oidc-callback',
    component: OidcCallbackView,
    meta: { public: true }
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'home', component: HomeView },

      { path: 'projects', name: 'projects', component: ProjectsView },
      { path: 'projects/:id', name: 'project-detail', component: ProjectDetailView },

      { path: 'tasks', name: 'tasks', component: TasksView },
      { path: 'tasks/:id', name: 'task-detail', component: TaskDetailView },

      { path: 'vulnerabilities', name: 'vulnerabilities', component: VulnerabilitiesView },
      { path: 'vulnerabilities/:id', name: 'vulnerability-detail', component: VulnerabilityDetailView }
    ]
  }
]

// PUBLIC_INTERFACE
export const router = createRouter({
  /** Application router (history mode). Protected routes require authentication. */
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  // Public routes bypass auth check.
  if (to.meta.public) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})
