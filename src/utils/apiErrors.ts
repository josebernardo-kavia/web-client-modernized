import axios from 'axios'
import type { ProblemDetails } from '@/api/types'

export type FieldErrors = Record<string, string[]>

/**
 * Normalize backend errors into a user-facing message plus optional field errors.
 *
 * This tries to handle:
 * - RFC7807-ish { title, detail }
 * - FastAPI/Pydantic-ish { detail: [{ loc, msg, type }, ...] }
 * - Custom { errors: { field: ["msg"] } } shapes
 */
// PUBLIC_INTERFACE
export function parseApiError(e: unknown): { message: string; fieldErrors: FieldErrors } {
  /** Parse Axios/backend errors into a message and per-field validation errors. */
  const fieldErrors: FieldErrors = {}

  if (axios.isAxiosError(e)) {
    const status = e.response?.status
    const data = e.response?.data as any

    // FastAPI validation error shape
    // { detail: [{ loc: ["body","name"], msg: "field required", type: "value_error.missing" }, ...] }
    if (Array.isArray(data?.detail)) {
      for (const item of data.detail) {
        const loc = Array.isArray(item?.loc) ? item.loc : []
        // Try to extract the last path segment after 'body'
        const idx = loc.indexOf('body')
        const key =
          idx >= 0 && loc.length > idx + 1
            ? String(loc[idx + 1])
            : loc.length
              ? String(loc[loc.length - 1])
              : 'form'
        const msg = item?.msg ? String(item.msg) : 'Invalid value'
        fieldErrors[key] = [...(fieldErrors[key] ?? []), msg]
      }

      const msg = status ? `HTTP ${status}: Validation failed.` : 'Validation failed.'
      return { message: msg, fieldErrors }
    }

    // Common custom mapping: { errors: { field: ["msg"] } }
    if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
      for (const [k, v] of Object.entries(data.errors)) {
        if (Array.isArray(v)) fieldErrors[k] = v.map((x) => String(x))
        else if (typeof v === 'string') fieldErrors[k] = [v]
      }
    }

    const pd = data as ProblemDetails
    const detail = typeof pd?.detail === 'string' ? pd.detail : null
    const title = typeof pd?.title === 'string' ? pd.title : null

    const base = detail || title || (e.message ? String(e.message) : 'Request failed.')
    const message = status ? `HTTP ${status}: ${base}` : base

    return { message, fieldErrors }
  }

  if (e instanceof Error) return { message: e.message, fieldErrors }
  return { message: 'Request failed.', fieldErrors }
}

function stringifyUnknown(v: unknown): string {
  if (typeof v === 'string') return v
  if (v === null || v === undefined) return ''
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

// PUBLIC_INTERFACE
export function formatFieldErrors(fieldErrors: FieldErrors, field: string): string | null {
  /** Join field errors into a single human-readable string for inline form display. */
  const errs = fieldErrors[field]
  if (!errs || errs.length === 0) return null
  return errs.map(stringifyUnknown).filter(Boolean).join(' • ')
}
