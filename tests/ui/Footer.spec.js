// HOU QINGSHAN ui test for Footer component
import { test, expect } from '@playwright/test';

const LINKS = [
  { name: /about/i,   path: /\/about/i,   heading: /about/i },
  { name: /contact/i, path: /\/contact/i, heading: /contact/i },
  { name: /privacy policy/i, path: /\/policy/i, heading: /privacy/i },
];

test.describe('Footer', () => {
  test('renders and shows expected links', async ({ page }) => {
    await page.goto('/');

    // Find the footer by its landmark role
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();

    // Branding text
    await expect(footer).toContainText(/All Rights Reserved/i);

    // Links visible with the right names
    for (const { name } of LINKS) {
      await expect(footer.getByRole('link', { name })).toBeVisible();
    }

    // Optional: exactly 3 links in the footer
    await expect(footer.getByRole('link')).toHaveCount(3);
  });

  for (const { name, path, heading } of LINKS) {
    test(`navigates to ${String(name)} page when clicked from footer`, async ({ page }) => {
      await page.goto('/');

      const footer = page.getByRole('contentinfo');
      const link = footer.getByRole('link', { name });
      await expect(link).toBeVisible();

      // If links open in same tab (typical SPA):
      await link.click();

      // Assert URL changed to expected route
      await expect(page).toHaveURL(path);

    });
  }
});