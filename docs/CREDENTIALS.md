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
   - `npm run migration:run`
   - `npm run seed`
5. Open http://localhost:3000 and sign in with the table above.
