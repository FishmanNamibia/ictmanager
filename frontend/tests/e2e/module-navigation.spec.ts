import { test, expect } from '@playwright/test';

const modules = [
  { label: 'My Desk', path: '/dashboard' },
  { label: 'Assets', path: '/assets' },
  { label: 'Licenses', path: '/licenses' },
  { label: 'Applications', path: '/applications' },
  { label: 'Staff & Skills', path: '/staff' },
  { label: 'ICT Policies', path: '/policies' },
  { label: 'Cybersecurity', path: '/cybersecurity' },
  { label: 'ICT Projects', path: '/projects' },
  { label: 'Data Governance', path: '/data-governance' },
  { label: 'Service Desk', path: '/service-desk' },
  { label: 'Executive view', path: '/executive' },
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('sidebar module links open without 5xx or page errors', async ({ page }) => {
  const api5xxErrors: string[] = [];
  const pageErrors: string[] = [];
  const timings: Array<{ label: string; ms: number }> = [];

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 500 && response.url().includes('/api/')) {
      api5xxErrors.push(`${status} ${response.url()}`);
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);

  for (const moduleItem of modules) {
    const start = Date.now();
    await page
      .getByRole('link', { name: new RegExp(`^${escapeRegExp(moduleItem.label)}$`, 'i') })
      .first()
      .click();

    await page.waitForURL(
      new RegExp(`${escapeRegExp(moduleItem.path)}(?:\\?.*)?$`),
      { timeout: 60_000 },
    );
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).toContainText(/\S+/, { timeout: 30_000 });
    await expect(page.locator('main')).not.toContainText(/internal server error/i);

    timings.push({ label: moduleItem.label, ms: Date.now() - start });
  }

  test.info().annotations.push({
    type: 'navigation-timings',
    description: JSON.stringify(timings),
  });

  expect.soft(api5xxErrors, `API 5xx responses:\n${api5xxErrors.join('\n')}`).toEqual([]);
  expect.soft(pageErrors, `Page errors:\n${pageErrors.join('\n')}`).toEqual([]);
});
