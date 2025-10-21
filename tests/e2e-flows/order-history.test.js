/**
 * E2E Test #15: Order History (User Orders)
 *
 * Tests user order history display functionality
 * Aligns with Dashboard.integration.test.js (user dashboard navigation, auth flow)
 *
 * Scenarios:
 * - Navigate to orders from user dashboard
 * - Display order details after successful checkout
 * - Show multiple orders when user has multiple checkouts
 * - Redirect to login when not authenticated
 */

import { test, expect } from '../fixtures/testData.js';
import { loginRegularUser, clearStorage } from '../helpers/authHelpers.js';

test.describe.configure({mode: "serial"});

test.describe("Order History - Navigation and Access", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should navigate to orders from user dashboard", async ({page}) => {
        // Arrange - Login and go to dashboard
        await loginRegularUser(page);

        // Act - Navigate through UI
        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: /orders/i }).click();

        // Assert - Redirected to orders page
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/);
        await expect(page.getByRole('heading', { name: /orders/i })).toBeVisible();
    });
});

test.describe("Order History - Order Display", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should display order details after successful checkout", async ({page}) => {
        // Arrange - Login and create an order through checkout
        await loginRegularUser(page);

        // Add product to cart
        await page.getByRole('button', { name: 'ADD TO CART' }).first().click();;

        // Go to cart and checkout
        await page.goto("http://localhost:3000/cart");

        // Fill Braintree payment
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame()
            .getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame()
            .getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame()
            .getByRole('textbox', { name: 'CVV' }).fill('123');

        // Submit payment
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();

        // Act - Should redirect to orders page after successful payment
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });

        // Assert - Order appears in orders list
        await page.waitForSelector('[data-testid="order-0"]');
        await expect(page.getByTestId("order-0")).toBeVisible();
        await expect(page.getByTestId("order-payment-0")).toContainText("Success");
        await expect(page.getByTestId("order-status-0")).toContainText("Not Process");
        await expect(page.getByTestId("order-buyer-0")).toContainText("Test User");
    });

    test("should show multiple orders when user has multiple checkouts", async ({page}) => {
        // Arrange - Create first order
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/product/headphones");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-headphones"]');

        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame()
            .getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame()
            .getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame()
            .getByRole('textbox', { name: 'CVV' }).fill('123');

        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });

        // Create second order
        await page.goto("http://localhost:3000/product/keyboard");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-keyboard"]');

        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame()
            .getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame()
            .getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame()
            .getByRole('textbox', { name: 'CVV' }).fill('123');

        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();

        // Act - View orders page
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });

        // Assert - Both orders visible
        await page.waitForSelector('[data-testid="order-0"]');
        await page.waitForSelector('[data-testid="order-1"]');
        await expect(page.getByTestId("order-0")).toBeVisible();
        await expect(page.getByTestId("order-1")).toBeVisible();
    });
});
