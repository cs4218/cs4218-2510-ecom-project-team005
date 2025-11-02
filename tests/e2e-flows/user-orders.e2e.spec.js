// tests/e2e-flows/user-orders.e2e.spec.js
import { test, expect } from "@playwright/test";

test("user can view their orders page", async ({ page }) => {
  // 1. login dulu (sesuaikan sama app kamu)
  await page.goto("http://localhost:3000/login");
  await page.fill('input[name="email"]', "user@test.com");
  await page.fill('input[name="password"]', "user123");
  await page.click('button[type="submit"]');

  // 2. pergi ke orders
  await page.goto("http://localhost:3000/dashboard/user/orders");

  // 3. cek title dari komponen Orders.js kamu
  await expect(page.getByTestId("orders-title")).toBeVisible();
});
