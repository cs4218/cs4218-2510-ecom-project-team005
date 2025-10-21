/**
 * E2E Test #15: Order History (User Orders)
 *
 * Tests user order history display functionality
 * Aligns with Dashboard.integration.test.js (user dashboard navigation, auth flow)
 *
 * Scenarios:
 * - View order history as logged-in user
 * - Display order details (status, date, products, payment status)
 * - Handle empty order history
 * - Verify order data matches backend
 */

import { test, expect } from '../fixtures/testData.js';
import { loginRegularUser, clearStorage } from '../helpers/authHelpers.js';

test.describe.configure({mode: "serial"});

test.describe("Order History - User Orders Display", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should display user orders page when logged in", async ({page}) => {
        // Arrange - Login as user
        await loginRegularUser(page);

        // Act - Navigate to orders page
        await page.goto("http://localhost:3000/dashboard/user/orders");

        // Wait for PrivateRoute auth check to complete and page to render
        await page.waitForTimeout(2000);

        // Assert - Wait for orders page title to appear
        await page.waitForSelector('[data-testid="orders-title"]', { timeout: 10000 });
        await expect(page.getByTestId("orders-title")).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/);
    });

    test("should show empty state when user has no orders", async ({page}) => {
        // Arrange - Login as user (no orders created yet)
        await loginRegularUser(page);

        // Act - Navigate to orders page
        await page.goto("http://localhost:3000/dashboard/user/orders");

        // Assert - Empty state or no orders message visible
        // Note: Depending on implementation, might show empty table or message
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/);

        // Check for order table/list container
        const hasOrders = await page.locator('[data-testid^="order-"]').count();
        expect(hasOrders).toBe(0);
    });

    test("should navigate to orders from user dashboard", async ({page}) => {
        // Arrange - Login and go to dashboard
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user");

        // Act - Click orders link in UserMenu
        await page.getByRole('link', { name: /orders/i }).click();

        // Assert - Redirected to orders page
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/);
        await expect(page.getByTestId("orders-title")).toBeVisible();
    });

    test("should redirect to login when not authenticated", async ({page}) => {
        // Arrange - No login, clear session
        await clearStorage(page);

        // Act - Try to access orders page
        await page.goto("http://localhost:3000/dashboard/user/orders");

        // Assert - Redirected to login via Spinner
        await expect(page.locator('text=redirecting to you in')).toBeVisible();

        // Wait for redirect
        await page.waitForTimeout(3500);
        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe("Order History - Order Display and Details", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should display order details after successful checkout", async ({page}) => {
        // Arrange - Login and create an order through checkout
        await loginRegularUser(page);

        // Add product to cart
        await page.goto("http://localhost:3000/product/laptop");
        await page.waitForSelector('[data-testid="add-to-cart-button"]');
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        // Go to cart and checkout
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-laptop"]');

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
        await expect(page.getByTestId("order-quantity-0")).toContainText("1");
    });

    test("should display correct order status and buyer information", async ({page}) => {
        // Arrange - Create order first
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/product/smartphone");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-smartphone"]');

        // Complete checkout
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame()
            .getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame()
            .getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame()
            .getByRole('textbox', { name: 'CVV' }).fill('123');

        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();

        // Act - View order details
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        await page.waitForSelector('[data-testid="order-0"]');

        // Assert - Order contains correct information
        await expect(page.getByTestId("order-status-0")).toContainText("Not Process");
        await expect(page.getByTestId("order-payment-0")).toContainText("Success");
        await expect(page.getByTestId("order-buyer-0")).toContainText("Test User");
    });

    test("should display product information within order", async ({page}) => {
        // Arrange - Create order with specific product
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/product/tablet");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-tablet"]');

        // Complete checkout
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame()
            .getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame()
            .getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame()
            .getByRole('textbox', { name: 'CVV' }).fill('123');

        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();

        // Act - View order
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        await page.waitForSelector('[data-testid="order-0"]');

        // Assert - Product details displayed in order
        await expect(page.getByTestId("order-0-product-0-name")).toContainText("Tablet");
        await expect(page.getByTestId("order-0-product-0-price")).toContainText("499");
    });

    test("should display multiple products in single order", async ({page}) => {
        // Arrange - Add multiple products to cart
        await loginRegularUser(page);

        await page.goto("http://localhost:3000/product/t-shirt");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        await page.goto("http://localhost:3000/product/jeans");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        // Checkout with both products
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-t-shirt"]');
        await page.waitForSelector('[data-testid="cart-item-jeans"]');

        await page.getByRole('button', { name: 'Paying with Card' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame()
            .getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame()
            .getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame()
            .getByRole('textbox', { name: 'CVV' }).fill('123');

        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();

        // Act - View order
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        await page.waitForSelector('[data-testid="order-0"]');

        // Assert - Both products displayed in order
        await expect(page.getByTestId("order-quantity-0")).toContainText("2");
        await expect(page.getByTestId("order-0-product-0")).toBeVisible();
        await expect(page.getByTestId("order-0-product-1")).toBeVisible();
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
