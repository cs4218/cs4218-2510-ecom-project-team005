import { test, expect } from '../fixtures/testData.js';

test('user can open Login page and see fields', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();

  // ganti sesuai placeholder di form kamu
  await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  await expect(page.getByPlaceholder(/password/i)).toBeVisible();

  // tombol login
  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});
