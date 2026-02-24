# E2E Smoke Tests (Playwright)

These tests cover login and module navigation smoke checks for the ICT app.

## Commands

```bash
pnpm --filter frontend e2e:install
pnpm --filter frontend e2e
```

From repository root:

```bash
pnpm test:e2e
```

## Required running services

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## Optional environment overrides

- `E2E_BASE_URL` (default: `http://localhost:3000`)
- `E2E_TENANT` (default: `demo`)
- `E2E_EMAIL` (default: `admin@demo.local`)
- `E2E_PASSWORD` (default: `Password1`)

