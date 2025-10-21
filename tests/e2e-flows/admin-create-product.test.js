/**
 * E2E Test #17: Admin - Create Product
 *
 * Tests admin product creation flow
 * Aligns with Products.integration.test.js (admin product management)
 *
 * Scenarios:
 * - Admin creates new product with all required fields
 * - Product appears in admin products list
 * - Product appears in specific category page
 * - Access control (regular user cannot create products)
 */

import { test, expect } from '../fixtures/testData.js';
import { loginAdmin, clearStorage } from '../helpers/authHelpers.js';
import path from 'path';

test.describe.configure({mode: "serial"});

test.describe("Admin Create Product - Product Creation", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should create product with all required fields successfully", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);

        // Act - Navigate to create product through UI
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Product' }).click();

        // Assert - Create product page loaded
        await expect(page.getByRole('heading', { name: 'Create Product' })).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-product/);

        // Fill form
        await page.getByRole('textbox', { name: 'write a name' }).fill('E2E Test Product');
        await page.getByRole('textbox', { name: 'write a description' }).fill('This is a test product created by E2E test');
        await page.getByPlaceholder('write a Price').fill('299');
        await page.getByPlaceholder('write a quantity').fill('25');

        // Select Electronics category
        await page.locator('div').filter({ hasText: /^Select Shipping$/ }).nth(1).click();
        await page.getByTitle('Yes').click();
        await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
        await page.getByText('Electronics').nth(1).click();


        // Upload test image
        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.getByText('Upload Photo').setInputFiles(testImagePath);

        // Submit form
        await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

        // Assert - Success message displayed
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });
    });

    test("should display created product in admin products list", async ({page}) => {
        // Arrange - Login and navigate to create product
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Product' }).click();

        // Fill form
        await page.getByRole('textbox', { name: 'write a name' }).fill('E2E Test Product');
        await page.getByRole('textbox', { name: 'write a description' }).fill('This is a test product created by E2E test');
        await page.getByPlaceholder('write a Price').fill('299');
        await page.getByPlaceholder('write a quantity').fill('25');

        // Select Electronics category
        await page.locator('div').filter({ hasText: /^Select Shipping$/ }).nth(1).click();
        await page.getByTitle('Yes').click();
        await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
        await page.getByText('Electronics').nth(1).click();
        
        // Upload test image
        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.getByText('Upload Photo').setInputFiles(testImagePath);

        // Submit form
        await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Navigate to admin products list through UI
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Products' }).click();

        // Assert - Product appears in list
        await expect(page.getByRole('link', { name: 'E2E Test Product' })).toBeVisible();
    });

    test("should create product in specific category and appear on category page", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Product' }).click();

        // Act - Create product in Clothing category
        await page.getByRole('textbox', { name: 'write a name' }).fill('Category Test Shirt');
        await page.getByRole('textbox', { name: 'write a description' }).fill('Test product for category');
        await page.getByPlaceholder('write a Price').fill('45');
        await page.getByPlaceholder('write a quantity').fill('30');

        // Select Clothing category
        await page.locator('div').filter({ hasText: /^Select Shipping$/ }).nth(1).click();
        await page.getByTitle('Yes').click();
        await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
        await page.getByText('Clothing').nth(1).click();

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.getByText('Upload Photo').setInputFiles(testImagePath);

        await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Act - Navigate to Clothing category page
        await page.goto("http://localhost:3000/category/clothing");

        // Assert - Product appears in category
        await expect(page.locator('text=Category Test Shirt')).toBeVisible();
    });
});

test.describe("Admin Create Product - Access Control", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should redirect regular user from create product page", async ({page}) => {
        // Arrange - Login as regular user (not admin)
        await page.goto("http://localhost:3000/login");
        await page.getByTestId("login-email-input").fill("user@test.com");
        await page.getByTestId("login-password-input").fill("password123");
        await page.getByTestId("login-submit-button").click();
        await page.waitForURL(/.*\//, { timeout: 10000 });

        // Act - Try to access admin create product page
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Assert - Redirected away (not allowed)
        await page.waitForTimeout(3500); // Wait for Spinner redirect
        await expect(page).not.toHaveURL(/.*\/dashboard\/admin\/create-product/);
    });
});
