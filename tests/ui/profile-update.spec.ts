import { test, expect } from '@playwright/test';

test('login then update profile name', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('cs4218@test.com');
  await page.getByLabel(/password/i).fill('password123'); // sesuaikan kalau flow login minta lain
  await page.getByRole('button', { name: /login/i }).click();
  await page.getByRole('link', { name: /profile/i }).click();
  await page.getByLabel(/name/i).fill('Ridwan F');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText(/updated/i)).toBeVisible();
});
