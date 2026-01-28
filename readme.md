# web-client-modernized

Modernized Vue 3 (Vite + TypeScript) web client for the security operations platform.

## Prerequisites
- Node.js 18+ recommended

## Setup
```bash
npm install
```

Create an `.env` file (or configure environment variables) based on `.env.example`.

### Required configuration

- `VITE_API_BASE`  
  Base URL for the modernized REST API (FastAPI).  
  Default for preview/dev in this repo: `http://localhost:3002`

- OIDC / Keycloak (required for real login)
  - `VITE_OIDC_ISSUER` (e.g. `http://localhost:8080/realms/<realm>`)
  - `VITE_OIDC_CLIENT_ID`
  - `VITE_OIDC_REDIRECT_URI` (default: `http://localhost:3003/oidc/callback`)
  - `VITE_OIDC_SCOPE` (default: `openid profile email offline_access`)

## Run (dev)
```bash
npm run dev
```

Vite dev server listens on **http://localhost:3003**.

## Build
```bash
npm run build
```

## Notes
- API access uses `src/api/client.ts`, which reads `VITE_API_BASE` from `import.meta.env` and attaches `Authorization: Bearer <token>` from the Pinia auth store.
- Auth flow uses OIDC Authorization Code Flow + PKCE (`src/services/authService.ts`), driven by the `VITE_OIDC_*` environment variables.
