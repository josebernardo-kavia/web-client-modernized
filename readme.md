# web-client-modernized

Modernized Vue 3 (Vite + TypeScript) web client for the security operations platform.

## Prerequisites
- Node.js 18+ recommended

## Setup
```bash
npm install
```

Create an `.env` file (or configure environment variables) based on `.env.example`:

- `VITE_API_BASE` - Base URL for the REST API (FastAPI). Example: `http://localhost:8000`

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
- Routes are protected by a placeholder auth guard. Visit `/login` and click “Set demo token” to navigate the app.
- API access uses `src/api/client.ts` which reads `VITE_API_BASE` and attaches `Authorization: Bearer <token>` from the Pinia auth store.
"""
