import { expect, test } from '@playwright/test';

test('invalid token forces logout and shows session-expired notice', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('iictms_token', 'invalid.token.value');
    localStorage.setItem(
      'iictms_user',
      JSON.stringify({
        id: 'stale-session-user',
        email: 'stale@demo.local',
        fullName: 'Stale Session',
        role: 'ict_manager',
        tenantId: '00000000-0000-0000-0000-000000000000',
        tenantSlug: 'demo',
      }),
    );
  });

  await page.goto('/dashboard');
  await page.waitForURL('**/login', { timeout: 60_000 });

  await expect(page.getByText(/session expired\. please sign in again\./i)).toBeVisible();
  await expect(page.getByText(/internal server error/i)).toHaveCount(0);
});

test('ict manager can create a policy successfully', async ({ page }) => {
  const title = `E2E Policy ${Date.now()}`;

  await page.goto('/policies');
  await expect(page.getByRole('heading', { name: /ict policies module/i })).toBeVisible();

  await page.getByRole('button', { name: /^add policy$/i }).click();
  await page.getByLabel(/policy title/i).fill(title);

  const createResponsePromise = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === 'POST' && response.url().includes('/api/policies');
  });

  await page.getByRole('button', { name: /create policy/i }).click();
  const createResponse = await createResponsePromise;

  expect(createResponse.status(), `Policy create API failed: ${createResponse.url()}`).toBeLessThan(400);
  await expect(page.getByText(/policy created\./i)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('table').getByText(title)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/internal server error/i)).toHaveCount(0);
});
