// tests/e2e-flows/admin-orders.e2e.spec.js
import { test, expect } from "@playwright/test";

test("admin can view all orders", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', "admin@test.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');

  await page.goto("http://localhost:3000/dashboard/admin/orders");

  await expect(page.getByText(/Orders/i)).toBeVisible();
});
