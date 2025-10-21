import { test, expect } from "../fixtures/testData.js"; // provides testData.seedAll()

test.describe("UI - Login Page", () => {
    test.beforeEach(async ({ page, testData, context }) => {
        // Ensure memory DB seeded for consistent data (users, etc.)
        await testData.seedAll();
        await context.clearCookies();
        await page.goto("http://localhost:3000/login");
        await page.evaluate(() => localStorage.clear());
    });

    test("renders all expected elements", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /login form/i })).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
        await expect(page.getByPlaceholder("Enter Your Password")).toBeVisible();
        await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /forgot password/i })).toBeVisible();
    });

    test("allows typing in email and password fields and preserves values", async ({ page }) => {
        const email = "ui-test@login.test";
        const password = "mySecret123";

        const emailInput = page.getByPlaceholder("Enter Your Email");
        const passwordInput = page.getByPlaceholder("Enter Your Password");

        await emailInput.fill(email);
        await passwordInput.fill(password);

        await expect(emailInput).toHaveValue(email);
        await expect(passwordInput).toHaveValue(password);
    });

    test("password input should be masked", async ({ page }) => {
        const passwordInput = page.getByPlaceholder("Enter Your Password");
        await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("navigates to forgot password page when clicked", async ({ page }) => {
        await page.getByRole("button", { name: /forgot password/i }).click();
        await expect(page).toHaveURL(/forgot-password$/);
    });

    test("shows HTML required validation when submitting empty form", async ({ page }) => {
        await page.getByRole("button", { name: /login/i }).click();
        await expect(page.getByRole("heading", { name: /login form/i })).toBeVisible();
    });
});
