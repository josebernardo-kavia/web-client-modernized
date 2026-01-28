import { apiClient } from '@/api/client'

export type OidcTokens = {
  accessToken: string
  refreshToken?: string
  expiresAt: number // epoch ms
  idToken?: string
  tokenType?: string
  scope?: string
}

type OidcDiscovery = {
  authorization_endpoint: string
  token_endpoint: string
  end_session_endpoint?: string
}

function assertEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function sha256(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  return await crypto.subtle.digest('SHA-256', data)
}

function randomString(length = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => charset[b % charset.length]).join('')
}

function nowMs(): number {
  return Date.now()
}

function parseJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function fetchDiscovery(issuer: string): Promise<OidcDiscovery> {
  const url = issuer.replace(/\/+$/, '') + '/.well-known/openid-configuration'
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new Error(`Failed OIDC discovery (${res.status}): ${url}`)
  }
  return (await res.json()) as OidcDiscovery
}

function parseTokenResponseToTokens(tokenResponse: any): OidcTokens {
  const accessToken = String(tokenResponse.access_token ?? '')
  if (!accessToken) throw new Error('Token response missing access_token')

  const refreshToken = tokenResponse.refresh_token ? String(tokenResponse.refresh_token) : undefined
  const expiresIn = Number(tokenResponse.expires_in ?? 0)
  const expiresAt = nowMs() + Math.max(0, expiresIn - 10) * 1000 // 10s skew

  return {
    accessToken,
    refreshToken,
    expiresAt,
    idToken: tokenResponse.id_token ? String(tokenResponse.id_token) : undefined,
    tokenType: tokenResponse.token_type ? String(tokenResponse.token_type) : undefined,
    scope: tokenResponse.scope ? String(tokenResponse.scope) : undefined
  }
}

function getIssuer(): string {
  return assertEnv('VITE_OIDC_ISSUER', import.meta.env.VITE_OIDC_ISSUER)
}

function getClientId(): string {
  return assertEnv('VITE_OIDC_CLIENT_ID', import.meta.env.VITE_OIDC_CLIENT_ID)
}

function getRedirectUri(): string {
  return assertEnv('VITE_OIDC_REDIRECT_URI', import.meta.env.VITE_OIDC_REDIRECT_URI)
}

function getScope(): string {
  // Default scope still includes openid, but encourage explicit config via env.
  return import.meta.env.VITE_OIDC_SCOPE && import.meta.env.VITE_OIDC_SCOPE.trim().length > 0
    ? import.meta.env.VITE_OIDC_SCOPE.trim()
    : 'openid profile email offline_access'
}

export type StartLoginResult = {
  authorizeUrl: string
  codeVerifier: string
  state: string
}

/**
 * Service to perform OIDC Authorization Code Flow with PKCE (Keycloak-compatible).
 * Uses OIDC discovery from the issuer to obtain endpoints.
 */
export class AuthService {
  private discovery: OidcDiscovery | null = null

  private async getDiscovery(): Promise<OidcDiscovery> {
    if (this.discovery) return this.discovery
    this.discovery = await fetchDiscovery(getIssuer())
    return this.discovery
  }

  // PUBLIC_INTERFACE
  async buildLoginUrl(extraState?: string): Promise<StartLoginResult> {
    /** Builds the OIDC authorize URL and returns state + PKCE verifier. */
    const discovery = await this.getDiscovery()

    const codeVerifier = randomString(96)
    const challenge = base64UrlEncode(await sha256(codeVerifier))

    const state = extraState && extraState.length > 0 ? extraState : randomString(24)

    const url = new URL(discovery.authorization_endpoint)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', getClientId())
    url.searchParams.set('redirect_uri', getRedirectUri())
    url.searchParams.set('scope', getScope())
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', challenge)
    url.searchParams.set('code_challenge_method', 'S256')

    return { authorizeUrl: url.toString(), codeVerifier, state }
  }

  // PUBLIC_INTERFACE
  async exchangeCodeForTokens(params: { code: string; codeVerifier: string }): Promise<OidcTokens> {
    /** Exchanges authorization code for tokens using PKCE verifier. */
    const discovery = await this.getDiscovery()
    const body = new URLSearchParams()
    body.set('grant_type', 'authorization_code')
    body.set('client_id', getClientId())
    body.set('redirect_uri', getRedirectUri())
    body.set('code', params.code)
    body.set('code_verifier', params.codeVerifier)

    // Use the shared API client to keep proxy/baseURL alignment, but do not send Bearer here.
    const res = await apiClient.post(discovery.token_endpoint, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // Ensure absolute token endpoint is honored (axios ignores baseURL when full URL is provided).
      baseURL: undefined
    })

    return parseTokenResponseToTokens(res.data)
  }

  // PUBLIC_INTERFACE
  async refreshTokens(params: { refreshToken: string }): Promise<OidcTokens> {
    /** Refreshes tokens using refresh_token grant. Requires offline_access and Keycloak client settings. */
    const discovery = await this.getDiscovery()
    const body = new URLSearchParams()
    body.set('grant_type', 'refresh_token')
    body.set('client_id', getClientId())
    body.set('refresh_token', params.refreshToken)

    const res = await apiClient.post(discovery.token_endpoint, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      baseURL: undefined
    })

    return parseTokenResponseToTokens(res.data)
  }

  // PUBLIC_INTERFACE
  getUserInfoFromAccessToken(accessToken: string): { username?: string; email?: string } {
    /** Best-effort extraction of a displayable user identity from the JWT access token. */
    const claims = parseJwtClaims(accessToken)
    if (!claims) return {}
    return {
      username:
        (claims.preferred_username as string | undefined) ||
        (claims.sub as string | undefined) ||
        undefined,
      email: (claims.email as string | undefined) || undefined
    }
  }
}

// PUBLIC_INTERFACE
export const authService = new AuthService()
/** Singleton AuthService instance. */
