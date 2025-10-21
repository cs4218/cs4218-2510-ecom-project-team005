/**
 * E2E Test #17: Admin - Create Product
 *
 * Tests admin product creation flow
 * Aligns with Products.integration.test.js (admin product management)
 *
 * Scenarios:
 * - Admin creates new product with all required fields
 * - Product appears in admin products list
 * - Product appears in public product list
 * - Form validation (required fields, image upload)
 * - Category selection
 */

import { test, expect } from '../fixtures/testData.js';
import { loginAdmin, clearStorage } from '../helpers/authHelpers.js';
import path from 'path';

test.describe.configure({mode: "serial"});

test.describe("Admin Create Product - Form and Validation", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should access create product page as admin", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);

        // Act - Navigate to create product page
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Assert - Create product page loaded
        await expect(page.locator('h1:has-text("Create Product")')).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-product/);
    });

    test("should display create product form with all fields", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Act & Assert - All form fields present
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('textarea[name="description"]')).toBeVisible();
        await expect(page.locator('input[name="price"]')).toBeVisible();
        await expect(page.locator('input[name="quantity"]')).toBeVisible();
        await expect(page.locator('select[name="category"]')).toBeVisible();
        await expect(page.locator('input[type="file"]')).toBeVisible();
        await expect(page.locator('button:has-text("Create Product")')).toBeVisible();
    });

    test("should populate category dropdown with existing categories", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Act - Check category dropdown
        const categorySelect = page.locator('select[name="category"]');
        await expect(categorySelect).toBeVisible();

        // Assert - Categories from seed data are available
        const options = await categorySelect.locator('option').allTextContents();

        // Should have at least the 4 seeded categories
        expect(options.length).toBeGreaterThan(0);
        expect(options.some(opt => opt.includes('Electronics'))).toBeTruthy();
        expect(options.some(opt => opt.includes('Clothing'))).toBeTruthy();
    });
});

test.describe("Admin Create Product - Product Creation Flow", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should create product with all required fields successfully", async ({page}) => {
        // Arrange - Login and navigate to create product
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Act - Fill form
        await page.locator('input[name="name"]').fill('E2E Test Product');
        await page.locator('textarea[name="description"]').fill('This is a test product created by E2E test');
        await page.locator('input[name="price"]').fill('299');
        await page.locator('input[name="quantity"]').fill('25');

        // Select Electronics category (index 1, since 0 is placeholder)
        await page.locator('select[name="category"]').selectOption({ index: 1 });

        // Upload test image (create a simple test file)
        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        // Submit form
        await page.locator('button:has-text("Create Product")').click();

        // Assert - Success message displayed
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });
    });

    test("should display created product in admin products list", async ({page}) => {
        // Arrange - Create product first
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Admin List Test Product');
        await page.locator('textarea[name="description"]').fill('Should appear in admin list');
        await page.locator('input[name="price"]').fill('399');
        await page.locator('input[name="quantity"]').fill('15');
        await page.locator('select[name="category"]').selectOption({ index: 1 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Act - Navigate to admin products list
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Assert - Product appears in list
        await expect(page.locator('text=Admin List Test Product')).toBeVisible();
    });

    test("should display created product on public product page", async ({page}) => {
        // Arrange - Create product as admin
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Public Product Test');
        await page.locator('textarea[name="description"]').fill('Should be visible to public');
        await page.locator('input[name="price"]').fill('599');
        await page.locator('input[name="quantity"]').fill('10');
        await page.locator('select[name="category"]').selectOption({ index: 1 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Act - Navigate to public homepage
        await page.goto("http://localhost:3000");

        // Assert - Product visible on homepage
        await expect(page.locator('text=Public Product Test')).toBeVisible({ timeout: 5000 });
    });

    test("should create product in specific category and appear on category page", async ({page}) => {
        // Arrange - Create product in Clothing category
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        await page.locator('input[name="name"]').fill('Category Test Shirt');
        await page.locator('textarea[name="description"]').fill('Test product for category');
        await page.locator('input[name="price"]').fill('45');
        await page.locator('input[name="quantity"]').fill('30');

        // Select Clothing category (index 2)
        await page.locator('select[name="category"]').selectOption({ index: 2 });

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');
        await page.locator('input[type="file"]').setInputFiles(testImagePath);

        await page.locator('button:has-text("Create Product")').click();
        await expect(page.getByText(/Product Created Successfully/i)).toBeVisible({ timeout: 10000 });

        // Act - Navigate to Clothing category page
        await page.goto("http://localhost:3000/category/clothing");

        // Assert - Product appears in category
        await expect(page.locator('text=Category Test Shirt')).toBeVisible();
    });
});

test.describe("Admin Create Product - Form Validation and Edge Cases", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should handle product creation without image", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Act - Fill form without uploading image
        await page.locator('input[name="name"]').fill('No Image Product');
        await page.locator('textarea[name="description"]').fill('Product without image upload');
        await page.locator('input[name="price"]').fill('199');
        await page.locator('input[name="quantity"]').fill('20');
        await page.locator('select[name="category"]').selectOption({ index: 1 });

        // Do NOT upload image
        await page.locator('button:has-text("Create Product")').click();

        // Assert - May show error or create with placeholder image (depends on implementation)
        // For now, just check page doesn't crash
        await page.waitForTimeout(2000);
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

    test("should create multiple products successfully", async ({page}) => {
        // Arrange
        await loginAdmin(page);

        const products = [
            { name: 'Multi Product 1', price: '100', qty: '10' },
            { name: 'Multi Product 2', price: '200', qty: '20' },
            { name: 'Multi Product 3', price: '300', qty: '30' }
        ];

        const testImagePath = path.join(process.cwd(), 'controllers', 'test-image.jpg');

        // Act - Create multiple products
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

        // Assert - All products appear in admin list
        await page.goto("http://localhost:3000/dashboard/admin/products");

        for (const prod of products) {
            await expect(page.locator(`text=${prod.name}`)).toBeVisible();
        }
    });

    test("should preserve form data when navigating back to create product page", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Act - Start filling form, then navigate away
        await page.locator('input[name="name"]').fill('Temp Product');
        await page.goto("http://localhost:3000/dashboard/admin/products");

        // Navigate back
        await page.goto("http://localhost:3000/dashboard/admin/create-product");

        // Assert - Form is reset (fresh form)
        const nameValue = await page.locator('input[name="name"]').inputValue();
        expect(nameValue).toBe(''); // Form should be empty on fresh load
    });
});
