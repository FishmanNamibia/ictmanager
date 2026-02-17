# I-ICTMS — Integrated ICT Management System

**Single source of truth for ICT: monitor, manage, govern, and report.**

*"ERP for ICT Management"* — Multi-tenant SaaS, cloud-ready.

## Core Principles

- **Single source of truth** for ICT
- **Role-based access**: ICT Manager, Technician, Executive, Auditor, Business Manager, Vendor
- **Audit-ready by design** (full audit logs)
- **Dashboard-driven** management
- **Low admin overhead**
- **Policy + operations + strategy** in one place

## Architecture

```
Web Portal (Next.js + MUI)
         │
         ▼
API Layer (NestJS)
         │
         ├── Core Services
         │   ├── Asset & Inventory
         │   ├── Application Portfolio
         │   ├── ITSM (Phase 2)
         │   ├── Projects & Strategy (Phase 2)
         │   ├── Security & Risk (Phase 2)
         │   ├── Staff & Skills
         │   └── Reporting & Dashboards
         │
         ├── PostgreSQL (multi-tenant)
         ├── Audit & Logs
         └── Integrations (AD/LDAP, Email, etc.)
```

## Build Phases

| Phase | Scope |
|-------|--------|
| **1 – Foundation (MVP)** | Assets & software, Application inventory, Staff & skills, Basic dashboards |
| **2 – Operations** | ITSM, Projects, Risk & security |
| **3 – Strategy & Compliance** | Executive dashboards, Audit/ISO mapping, Advanced analytics |

## Tech Stack

- **Frontend**: Next.js 14, React, MUI (Material UI)
- **Backend**: Node.js, NestJS
- **Database**: PostgreSQL (multi-tenant via `tenant_id`)
- **Auth**: JWT + RBAC; optional AD/LDAP
- **Deployment**: Node (PM2 or similar); no Docker.

## Project structure

```
eitcms/
├── package.json
├── pnpm-workspace.yaml
├── README.md
│
├── backend/                  # Server — NestJS API
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/             # Login, JWT, guards
│   │   ├── tenant/           # Multi-tenant
│   │   ├── users/
│   │   ├── assets/           # Assets & licenses
│   │   ├── applications/
│   │   ├── staff/            # Staff & skills
│   │   ├── dashboards/
│   │   ├── audit/
│   │   ├── config/
│   │   └── migrations/
│   ├── scripts/              # e.g. seed.ts
│   ├── package.json
│   └── .env.example
│
├── frontend/                 # Client — Next.js + MUI
│   ├── src/
│   │   ├── app/              # Routes: login, dashboard, assets, etc.
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   └── theme.ts
│   ├── package.json
│   └── .env.local.example
│
└── docs/
    └── SEED.md               # How to create first tenant & user
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- PostgreSQL (installed locally or remote; create a database e.g. `iictms`)

### 1. Database

Create a PostgreSQL database and note the connection URL, e.g.:

`postgresql://user:password@localhost:5432/iictms`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET
npm run migration:run
# Seed demo tenant + user: see docs/SEED.md (tenant: demo, admin@demo.local / Password1)
npm run start:dev
```

API: http://localhost:3001/api

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev
```

Web: http://localhost:3000

## Roles & Access

| Role           | Access |
|----------------|--------|
| ICT Manager    | Full control |
| ICT Staff      | Operational modules |
| Business Manager| Requests, dashboards |
| Executive      | Read-only dashboards |
| Auditor        | Evidence & logs |
| Vendor         | Limited portal |

## License

Proprietary — DynaCore ICT Manager / DynaGov ICT Suite.
