// HOU QINGSHAN test for Privacy Policy link navigation
import { test, expect } from '@playwright/test';

test('user can open Privacy Policy from homepage footer', async ({ page }) => {
  // 1) Go to homepage
  await page.goto('/');

  // 2) Find the Privacy Policy link by accessible name
  const privacyLink = page.getByRole('link', { name: /privacy policy/i });
  await expect(privacyLink).toBeVisible();

  // 3) Click it
  await privacyLink.click();

  // 4) Assert we navigated to the policy page
  await expect(page).toHaveURL(/\/policy/i);

  // 5) Assert the policy page contains expected text
  await expect(page.locator('body')).toContainText(/add privacy policy/i);
});