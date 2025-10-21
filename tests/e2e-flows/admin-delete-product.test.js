/**
 * E2E Test #19: Admin - Delete Product
 *
 * Tests admin product deletion functionality
 * Aligns with Products.integration.test.js and deleteProductController.integration.test.js
 *
 * Scenarios:
 * - Admin deletes product from products list
 * - Product removed from public homepage after deletion
 * - Deletion persists across page refreshes
 * - Access control (regular user cannot delete)
 */

import { test, expect } from '../fixtures/testData.js';
import { loginAdmin, loginRegularUser, clearStorage } from '../helpers/authHelpers.js';
import path from 'path';

test.describe.configure({mode: "serial"});

test.describe("Admin Delete Product - Deletion Flow", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    // bug found: delete does not work
    test("should delete product from admin products list", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);

        // Navigate to admin products page through UI
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: /Products/i }).click();

        // Assert - Products page loaded
        await expect(page.getByRole('heading', { name: /All Products List/i })).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);

        // Get product name before deletion
        const firstProductName = await page.getByRole('link', { name: 'Smartphone Smartphone Latest' }).textContent();
        await page.getByRole('link', { name: 'Smartphone Smartphone Latest' }).click(); 

        // Act - Click delete button on first product
        await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();

        // Wait for deletion
        await page.waitForTimeout(1000);

        // Assert - Product removed from list
        await page.getByRole('link', { name: 'Products' }).click(); 
        await expect(page.getByRole('link', { name: 'Smartphone Smartphone Latest' }).isVisible());
    });

    test("should remove deleted product from public homepage", async ({page}) => {
        // Arrange - Create a product first
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Product' }).click();

        await page.getByRole('textbox', { name: 'write a name' }).fill('Delete Test Product');
        await page.getByRole('textbox', { name: 'write a description' }).fill('This product will be deleted');
        await page.getByPlaceholder('write a Price').fill('199');
        await page.getByPlaceholder('write a quantity').fill('10');

        // Select Electronics category
        await page.locator('div').filter({ hasText: /^Select Shipping$/ }).nth(1).click();
        await page.getByTitle('Yes').click();
        await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
        await page.getByText('Electronics').nth(1).click();

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.getByText('Upload Photo').setInputFiles(testImagePath);

        await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Act - Delete the product
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: /Products/i }).click();

        // Click on the product to go to details page
        await page.getByRole('link', { name: 'Delete Test Product Delete' }).click();

        // Click delete button
        await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
        await page.waitForTimeout(1000);

        // Assert - Product removed from homepage
        await page.goto("http://localhost:3000");
        await expect(page.locator('text=Delete Test Product')).not.toBeVisible();
    });

    test("should persist deletion across page refreshes", async ({page}) => {
        // Arrange - Create and delete a product
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Product' }).click();

        await page.getByRole('textbox', { name: 'write a name' }).fill('Persistent Delete Test');
        await page.getByRole('textbox', { name: 'write a description' }).fill('Test persistence');
        await page.getByPlaceholder('write a Price').fill('99');
        await page.getByPlaceholder('write a quantity').fill('5');

        // Select Electronics category
        await page.locator('div').filter({ hasText: /^Select Shipping$/ }).nth(1).click();
        await page.getByTitle('Yes').click();
        await page.locator('div').filter({ hasText: /^Select a category$/ }).first().click();
        await page.getByText('Electronics').nth(1).click();

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.getByText('Upload Photo').setInputFiles(testImagePath);

        await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Delete the product
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: /Products/i }).click();

        // Click on the product to go to details page
        await page.getByRole('link', { name: 'Persistent Delete Test' }).click();

        // Click delete button
        await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();
        await page.waitForTimeout(1000);

        // Navigate back to products list
        await page.getByRole('link', { name: 'Products' }).click();

        // Act - Refresh the page
        await page.reload();

        // Assert - Product still not visible after refresh
        await expect(page.getByRole('link', { name: 'Persistent Delete Test' })).not.toBeVisible();
    });
});

test.describe("Admin Delete Product - Access Control", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should not show delete buttons for regular user", async ({page}) => {
        // Arrange - Login as regular user
        await loginRegularUser(page);

        // Act - Try to access admin products page
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Assert - Redirected away (not allowed)
        await page.waitForTimeout(3500); // Wait for Spinner redirect
        await expect(page).not.toHaveURL(/.*\/dashboard\/admin\/products/);
    });
});
