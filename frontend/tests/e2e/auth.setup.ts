import fs from 'node:fs';
import path from 'node:path';
import { test as setup, expect } from '@playwright/test';

const authFile = path.join(__dirname, '..', '..', 'playwright', '.auth', 'user.json');
const tenantSlug = process.env.E2E_TENANT ?? 'demo';
const email = process.env.E2E_EMAIL ?? 'admin@demo.local';
const password = process.env.E2E_PASSWORD ?? 'Password1';

setup('authenticate with login form', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel(/tenant/i).fill(tenantSlug);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 60_000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/dashboard$/);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
