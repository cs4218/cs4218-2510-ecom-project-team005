import { test, expect } from '../fixtures/testData.js';

test('homepage shows Login link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
});
