# Test Deployment

This project is ready to run in a simple Node-based test environment with PostgreSQL and PM2.

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL
- PM2 installed globally

## Required environment

### Backend

Create [backend/.env](/C:/Users/s.uulenga/Documents/ictmanager/backend/.env) with:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/iictms_test
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://test-your-domain.example
```

Optional SMTP:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Frontend

Create [frontend/.env.local](/C:/Users/s.uulenga/Documents/ictmanager/frontend/.env.local) with:

```env
NEXT_PUBLIC_API_URL=https://test-api.your-domain.example/api
```

## Build and migrate

From the repo root:

```bash
pnpm --filter backend build
pnpm --filter frontend build
pnpm --filter backend migration:run:prod
```

Seed test data if needed:

```bash
pnpm --filter backend seed
```

## Start with PM2

From the repo root:

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Reverse proxy

Use Nginx or IIS as the public entry point:

- `test-api.your-domain.example` -> `http://127.0.0.1:3001`
- `test.your-domain.example` -> `http://127.0.0.1:3000`

## Notes

- Backend production entrypoint is `backend/dist/src/main.js`.
- Backend CORS must include the frontend test origin.
- Run migrations on every backend release before restarting the API.
