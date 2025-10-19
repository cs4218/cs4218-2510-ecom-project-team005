import { test, expect } from '@playwright/test';

test('user can update profile', async ({ page }) => {
  await page.goto('/user/profile');
  await page.fill('input[name="name"]', 'Ridwan Update');
  await page.fill('input[name="phone"]', '08123456789');
  await page.click('button:has-text("Save")');
  await expect(page.getByText('Profile updated')).toBeVisible(); // sesuaikan
  await expect(page.locator('input[name="name"]')).toHaveValue('Ridwan Update');
});
