import { test as setup, expect } from '@playwright/test';

setup('login as user', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', 'user@test.com');
  await page.fill('input[name=password]', 'password'); // pakai seed user testing
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/home|\/$/);
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
});

setup('login as admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', 'admin@test.com');
  await page.fill('input[name=password]', 'password');
  await page.click('button:has-text("Login")');
  await expect(page).toHaveURL(/admin/);
  await page.context().storageState({ path: 'tests/e2e/.auth/admin.json' });
});
