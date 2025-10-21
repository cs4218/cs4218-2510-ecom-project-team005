// HOUQINGSHAN ui test for About page
import { test, expect } from '@playwright/test';

test('user can open About page from homepage footer and see a picture', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('/');

  // 2. Click the "About" link in the footer
  const aboutLink = page.getByRole('link', { name: /about/i });
  await expect(aboutLink).toBeVisible();
  await aboutLink.click();

  // 3. Check that we navigated to the About page
  await expect(page).toHaveURL(/\/about/i);

  // 4. Check for the presence of an image on the About page
  const image = page.locator('img');
  await expect(image.first()).toBeVisible();

  // Check that the About page has meaningful text content
  await expect(page.locator('body')).toContainText(/Add text/i);
});