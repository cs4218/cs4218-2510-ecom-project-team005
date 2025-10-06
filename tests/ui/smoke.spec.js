import { test, expect } from '@playwright/test';

test('homepage shows Login link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});
