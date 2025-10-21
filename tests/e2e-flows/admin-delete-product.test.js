/**
 * E2E Test #19: Admin - Delete Product
 *
 * Tests admin product deletion functionality
 * Aligns with Products.integration.test.js and deleteProductController.integration.test.js
 *
 * Scenarios:
 * - Admin deletes product from products list
 * - Product removed from admin products list
 * - Product removed from public product list
 * - Product removed from category pages
 * - Access control (regular user cannot delete)
 * - Verify deletion persists across page refreshes
 */

import { test, expect } from '../fixtures/testData.js';
import { loginAdmin, loginRegularUser, clearStorage } from '../helpers/authHelpers.js';
import path from 'path';

test.describe.configure({mode: "serial"});

test.describe("Admin Delete Product - Access and Navigation", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should access admin products page and view delete buttons", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);

        // Act - Navigate to admin products page
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Assert - Products page loaded with delete buttons
        await expect(page.locator('h1:has-text("All Products List")')).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/admin\/products/);

        // Should have delete buttons for products
        const deleteButtons = page.locator('button:has-text("DELETE")');
        await expect(deleteButtons.first()).toBeVisible();
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

test.describe("Admin Delete Product - Deletion Flow", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should delete product from admin products list", async ({page}) => {
        // Arrange - Login and navigate to products page
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Get product name before deletion
        const firstProductName = await page.locator('[data-testid^="product-"][data-testid$="-name"]').first().textContent();

        // Act - Click delete button on first product
        await page.locator('button:has-text("DELETE")').first().click();

        // Wait for deletion success message or page update
        await page.waitForTimeout(2000);

        // Assert - Product removed from list
        const productExists = await page.locator(`text=${firstProductName}`).count();
        expect(productExists).toBe(0);
    });

    test("should remove deleted product from public homepage", async ({page}) => {
        // Arrange - Create a product first
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Delete Test Product');
        await page.locator('textarea[name="description"]').fill('This product will be deleted');
        await page.locator('input[name="price"]').fill('199');
        await page.locator('input[name="quantity"]').fill('10');
        await page.locator('select[name="category"]').selectOption({ index: 1 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Verify product appears on homepage
        await page.goto("http://localhost:3000");
        await expect(page.locator('text=Delete Test Product')).toBeVisible();

        // Act - Delete the product
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Find and delete the specific product
        const productCard = page.locator('[data-testid="product-delete-test-product"]');
        await productCard.locator('button:has-text("DELETE")').click();
        await page.waitForTimeout(2000);

        // Assert - Product removed from homepage
        await page.goto("http://localhost:3000");
        await expect(page.locator('text=Delete Test Product')).not.toBeVisible();
    });

    test("should remove deleted product from category page", async ({page}) => {
        // Arrange - Create product in specific category
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Category Delete Test');
        await page.locator('textarea[name="description"]').fill('Will be deleted from category');
        await page.locator('input[name="price"]').fill('299');
        await page.locator('input[name="quantity"]').fill('15');

        // Select Clothing category (index 2)
        await page.locator('select[name="category"]').selectOption({ index: 2 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Verify product in category
        await page.goto("http://localhost:3000/category/clothing");
        await expect(page.locator('text=Category Delete Test')).toBeVisible();

        // Act - Delete the product
        await page.goto("http://localhost:3000/dashboard/admin/products");
        const productCard = page.locator('[data-testid="product-category-delete-test"]');
        await productCard.locator('button:has-text("DELETE")').click();
        await page.waitForTimeout(2000);

        // Assert - Product removed from category page
        await page.goto("http://localhost:3000/category/clothing");
        await expect(page.locator('text=Category Delete Test')).not.toBeVisible();
    });

    test("should persist deletion across page refreshes", async ({page}) => {
        // Arrange - Create and delete a product
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Persistent Delete Test');
        await page.locator('textarea[name="description"]').fill('Test persistence');
        await page.locator('input[name="price"]').fill('99');
        await page.locator('input[name="quantity"]').fill('5');
        await page.locator('select[name="category"]').selectOption({ index: 1 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Delete the product
        await page.goto("http://localhost:3000/dashboard/admin/products");
        const productCard = page.locator('[data-testid="product-persistent-delete-test"]');
        await productCard.locator('button:has-text("DELETE")').click();
        await page.waitForTimeout(2000);

        // Act - Refresh the page
        await page.reload();

        // Assert - Product still not visible after refresh
        await expect(page.locator('text=Persistent Delete Test')).not.toBeVisible();
    });
});

test.describe("Admin Delete Product - Multiple Deletions and Edge Cases", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should delete multiple products sequentially", async ({page}) => {
        // Arrange - Create 3 products
        await loginAdmin(page);

        const products = [
            { name: 'Delete Multi 1', price: '100', qty: '10' },
            { name: 'Delete Multi 2', price: '200', qty: '20' },
            { name: 'Delete Multi 3', price: '300', qty: '30' }
        ];

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');

        for (const prod of products) {
            await page.goto("http://localhost:3000/dashboard/admin/create-product");
            await page.locator('input[name="name"]').fill(prod.name);
            await page.locator('textarea[name="description"]').fill(`Description for ${prod.name}`);
            await page.locator('input[name="price"]').fill(prod.price);
            await page.locator('input[name="quantity"]').fill(prod.qty);
            await page.locator('select[name="category"]').selectOption({ index: 1 });
            await page.locator('input[type="file"]').setInputFiles(testImagePath);
            await page.locator('button:has-text("Create Product")').click();
            await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });
        }

        // Act - Delete all 3 products
        await page.goto("http://localhost:3000/dashboard/admin/products");

        for (const prod of products) {
            const slugName = prod.name.toLowerCase().replace(/\s+/g, '-');
            const productCard = page.locator(`[data-testid="product-${slugName}"]`);
            await productCard.locator('button:has-text("DELETE")').click();
            await page.waitForTimeout(1500);
        }

        // Assert - All products deleted
        await page.reload();
        for (const prod of products) {
            await expect(page.locator(`text=${prod.name}`)).not.toBeVisible();
        }
    });

    test("should handle deletion of last product in category gracefully", async ({page}) => {
        // Arrange - Create single product in Books category
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Last Book Product');
        await page.locator('textarea[name="description"]').fill('Only book product');
        await page.locator('input[name="price"]').fill('29');
        await page.locator('input[name="quantity"]').fill('5');

        // Select Books category (index 3)
        await page.locator('select[name="category"]').selectOption({ index: 3 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Act - Delete the product
        await page.goto("http://localhost:3000/dashboard/admin/products");
        const productCard = page.locator('[data-testid="product-last-book-product"]');
        await productCard.locator('button:has-text("DELETE")').click();
        await page.waitForTimeout(2000);

        // Assert - Books category page shows empty state or no products
        await page.goto("http://localhost:3000/category/books");

        // Should either show "No products found" or empty category
        const hasProducts = await page.locator('[data-testid^="product-card-"]').count();
        expect(hasProducts).toBe(0);
    });

    test("should update product count in admin list after deletion", async ({page}) => {
        // Arrange - Login and go to admin products
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Count initial products
        const initialCount = await page.locator('[data-testid^="product-"][data-testid$="-name"]').count();

        // Act - Delete one product
        await page.locator('button:has-text("DELETE")').first().click();
        await page.waitForTimeout(2000);

        // Assert - Product count decreased by 1
        const finalCount = await page.locator('[data-testid^="product-"][data-testid$="-name"]').count();
        expect(finalCount).toBe(initialCount - 1);
    });
});
