import { test, expect } from '@playwright/test';

test('add product to cart then see it in cart page', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-test="product-card"]').first().getByRole('button', { name: /add to cart/i }).click();
  await page.getByRole('link', { name: /cart/i }).click();
  await expect(page).toHaveURL(/cart/i);
  await expect(page.locator('[data-test="cart-item"]')).toHaveCount(1);
});
