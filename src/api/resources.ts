import { apiClient } from '@/api/client'
import type { ListResponse, Project, Task, Vulnerability } from '@/api/types'

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
