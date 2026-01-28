export type ListResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

export type Project = {
  id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type Task = {
  id: string
  project_id: string
  title: string
  description?: string | null
  status: string
  created_at?: string
  updated_at?: string
}

export type Vulnerability = {
  id: string
  project_id: string
  title: string
  description?: string | null
  severity: string
  status: string
  created_at?: string
  updated_at?: string
}

/**
 * RFC7807-ish "problem+json" payload (best-effort; backend returns this for errors).
 */
export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  [key: string]: unknown
}
