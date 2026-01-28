import { apiClient } from '@/api/client'
import type { ListResponse, Project, Task, Vulnerability } from '@/api/types'

export type ProjectCreate = { name: string; description?: string | null }
export type ProjectUpdate = { name?: string; description?: string | null }

export type TaskCreate = {
  project_id: string
  title: string
  description?: string | null
  status: string
}
export type TaskUpdate = {
  project_id?: string
  title?: string
  description?: string | null
  status?: string
}

export type VulnerabilityCreate = {
  project_id: string
  title: string
  description?: string | null
  severity: string
  status: string
}
export type VulnerabilityUpdate = {
  project_id?: string
  title?: string
  description?: string | null
  severity?: string
  status?: string
}

function cleanParams(obj: Record<string, unknown>): Record<string, unknown> {
  // Remove undefined/null/empty-string so we don't send noisy query params.
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim().length === 0) continue
    out[k] = v
  }
  return out
}

// PUBLIC_INTERFACE
export async function listProjects(params: {
  limit: number
  offset: number
  q?: string
}): Promise<ListResponse<Project>> {
  /** List projects with server-side pagination and optional search (q). */
  const res = await apiClient.get<ListResponse<Project>>('/projects', {
    params: cleanParams(params)
  })
  return res.data
}

// PUBLIC_INTERFACE
export async function listTasks(params: {
  limit: number
  offset: number
  q?: string
  project_id?: string
  status?: string
}): Promise<ListResponse<Task>> {
  /** List tasks with server-side pagination, optional search (q), and filters. */
  const res = await apiClient.get<ListResponse<Task>>('/tasks', {
    params: cleanParams(params)
  })
  return res.data
}

// PUBLIC_INTERFACE
export async function listVulnerabilities(params: {
  limit: number
  offset: number
  q?: string
  project_id?: string
  status?: string
  severity?: string
}): Promise<ListResponse<Vulnerability>> {
  /** List vulnerabilities with server-side pagination, optional search (q), and filters. */
  const res = await apiClient.get<ListResponse<Vulnerability>>('/vulnerabilities', {
    params: cleanParams(params)
  })
  return res.data
}

// Projects CRUD

// PUBLIC_INTERFACE
export async function getProject(id: string): Promise<Project> {
  /** Get a single project by id. */
  const res = await apiClient.get<Project>(`/projects/${encodeURIComponent(id)}`)
  return res.data
}

// PUBLIC_INTERFACE
export async function createProject(payload: ProjectCreate): Promise<Project> {
  /** Create a new project. */
  const res = await apiClient.post<Project>('/projects', payload)
  return res.data
}

// PUBLIC_INTERFACE
export async function updateProject(id: string, payload: ProjectUpdate): Promise<Project> {
  /** Update an existing project. */
  const res = await apiClient.put<Project>(`/projects/${encodeURIComponent(id)}`, payload)
  return res.data
}

// PUBLIC_INTERFACE
export async function deleteProject(id: string): Promise<void> {
  /** Delete a project. */
  await apiClient.delete(`/projects/${encodeURIComponent(id)}`)
}

// Tasks CRUD

// PUBLIC_INTERFACE
export async function getTask(id: string): Promise<Task> {
  /** Get a single task by id. */
  const res = await apiClient.get<Task>(`/tasks/${encodeURIComponent(id)}`)
  return res.data
}

// PUBLIC_INTERFACE
export async function createTask(payload: TaskCreate): Promise<Task> {
  /** Create a new task. */
  const res = await apiClient.post<Task>('/tasks', payload)
  return res.data
}

// PUBLIC_INTERFACE
export async function updateTask(id: string, payload: TaskUpdate): Promise<Task> {
  /** Update an existing task. */
  const res = await apiClient.put<Task>(`/tasks/${encodeURIComponent(id)}`, payload)
  return res.data
}

// PUBLIC_INTERFACE
export async function deleteTask(id: string): Promise<void> {
  /** Delete a task. */
  await apiClient.delete(`/tasks/${encodeURIComponent(id)}`)
}

// Vulnerabilities CRUD

// PUBLIC_INTERFACE
export async function getVulnerability(id: string): Promise<Vulnerability> {
  /** Get a single vulnerability by id. */
  const res = await apiClient.get<Vulnerability>(`/vulnerabilities/${encodeURIComponent(id)}`)
  return res.data
}

// PUBLIC_INTERFACE
export async function createVulnerability(payload: VulnerabilityCreate): Promise<Vulnerability> {
  /** Create a new vulnerability. */
  const res = await apiClient.post<Vulnerability>('/vulnerabilities', payload)
  return res.data
}

// PUBLIC_INTERFACE
export async function updateVulnerability(
  id: string,
  payload: VulnerabilityUpdate
): Promise<Vulnerability> {
  /** Update an existing vulnerability. */
  const res = await apiClient.put<Vulnerability>(`/vulnerabilities/${encodeURIComponent(id)}`, payload)
  return res.data
}

// PUBLIC_INTERFACE
export async function deleteVulnerability(id: string): Promise<void> {
  /** Delete a vulnerability. */
  await apiClient.delete(`/vulnerabilities/${encodeURIComponent(id)}`)
}
