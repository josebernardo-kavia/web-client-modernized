import { useAuthStore } from '@/stores/auth'

type JwtClaims = Record<string, unknown>

function parseJwt(token: string): JwtClaims | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as JwtClaims
  } catch {
    return null
  }
}

function extractRoles(claims: JwtClaims | null): Set<string> {
  const roles = new Set<string>()
  if (!claims) return roles

  // Common Keycloak shapes
  const realmAccess = claims['realm_access'] as any
  if (realmAccess && Array.isArray(realmAccess.roles)) {
    for (const r of realmAccess.roles) roles.add(String(r))
  }

  const resourceAccess = claims['resource_access'] as any
  if (resourceAccess && typeof resourceAccess === 'object') {
    for (const client of Object.values(resourceAccess)) {
      if (client && Array.isArray((client as any).roles)) {
        for (const r of (client as any).roles) roles.add(String(r))
      }
    }
  }

  // Generic 'roles' claim
  const generic = claims['roles'] as any
  if (Array.isArray(generic)) for (const r of generic) roles.add(String(r))

  return roles
}

/**
 * Very small RBAC helper:
 * - If no roles are present, assume read-only (safe default for UI gating).
 * - You can customize role names to match backend RBAC as needed.
 */
// PUBLIC_INTERFACE
export function useRbac() {
  /** Provide UI-level permission checks derived from current access token claims. */
  const auth = useAuthStore()
  const claims = auth.token ? parseJwt(auth.token) : null
  const roles = extractRoles(claims)

  const canWrite =
    roles.has('admin') ||
    roles.has('operator') ||
    roles.has('editor') ||
    roles.has('write') ||
    roles.has('projects:write') ||
    roles.has('tasks:write') ||
    roles.has('vulns:write')

  const canDelete =
    roles.has('admin') || roles.has('deleter') || roles.has('delete') || roles.has('projects:delete')

  return {
    roles,
    canWrite,
    canDelete
  }
}
