# Sign-in credentials (after seed)

Use these to log in at **http://localhost:3000** once the database is seeded.

| Field | Value |
|-------|--------|
| **Tenant (slug)** | `demo` |
| **Email** | `admin@demo.local` |
| **Password** | `Password1` |

Role: **ICT Manager** (full access).

---

**First-time setup**

1. Install and start PostgreSQL.
2. Create the database and user `root` (from project root):
   ```bash
   psql -U postgres -f backend/scripts/create-db.sql
   ```
   This creates user `root` with password `root` and database `iictms`.
3. Copy `backend/.env.example` to `backend/.env` (it already uses `root:root@localhost:5432/iictms`).
4. From `backend` run:
   - `npm run migration:run` (or apply `scripts/run-migration.sql` with psql)
   - For **ICT Policies** module, run: `psql -U root -d iictms -f scripts/policies-migration.sql`
   - `npm run seed`
5. Open http://localhost:3000 and sign in with the table above.

## Dev note: session reset after auth hardening rollout

After deploying auth/session hardening changes, stale browser JWTs may still exist in local storage.
Do one of the following once per browser profile:

1. Click **Logout** and sign in again.
2. Or clear `iictms_token` and `iictms_user` from local storage, then sign in again.

## Dev note: automation demo seed

To seed records that trigger cross-module automations and run one validation cycle:

```bash
npm --prefix backend run seed:automation-demo
```

This creates/updates demo vendor contract, license, policy, and vulnerability records, then runs `POST /api/automation/run`.
