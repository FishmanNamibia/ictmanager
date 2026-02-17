# Seed: get a user to sign in

After PostgreSQL is running and migrations are applied, seed the demo tenant and user.

## Quick steps

From the project root:

```bash
cd backend
npm run migration:run   # if you haven't already
npm run seed
```

Then sign in at **http://localhost:3000** with:

| Field     | Value              |
|----------|--------------------|
| **Tenant** (slug) | `demo`           |
| **Email**        | `admin@demo.local` |
| **Password**     | `Password1`        |

---

## What the seed does

- Creates tenant **demo** (Demo Organisation) if it doesn’t exist.
- Creates user **admin@demo.local** with role **ICT Manager** and password **Password1** if they don’t exist.
- Safe to run more than once (uses `ON CONFLICT DO NOTHING`).

---

## Option: SQL only

If you prefer to run SQL yourself (e.g. in `psql` or another client), see the SQL block in the previous version of this file or run `node scripts/seed.js` once and use the same credentials as above.

---

## New password hash

To generate a bcrypt hash for a different password:

```bash
cd backend && node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YourPassword', 12).then(console.log)"
```

Then update the user in the database or change the seed script and re-run it.
