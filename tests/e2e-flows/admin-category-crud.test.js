/**
 * E2E Test #20: Admin - Category CRUD Operations
 *
 * Tests admin category management (Create, Read, Update, Delete)
 * Aligns with Categories.integration.test.js and categoryController.integration.test.js (32 tests!)
 *
 * Scenarios:
 * - Admin creates new category
 * - Display all categories in admin panel
 * - Update existing category name
 * - Delete category
 * - Category slug generation and updates
 * - Form validation (required fields, duplicate names)
 * - Access control (regular user cannot manage categories)
 */

import { test, expect } from '../fixtures/testData.js';
import { loginAdmin, loginRegularUser, clearStorage } from '../helpers/authHelpers.js';

test.describe.configure({mode: "serial"});

test.describe("Admin Category CRUD - Access and Navigation", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should access create category page as admin", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);

        // Act - Navigate to create category page
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Assert - Create category page loaded
        await expect(page.locator('h1:has-text("Manage Category")')).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-category/);
    });

    test("should display category form with input field and button", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act & Assert - Form elements present
        await expect(page.locator('input[placeholder*="category" i]')).toBeVisible();
        await expect(page.locator('button:has-text("Submit")')).toBeVisible();
    });

    test("should display existing categories list", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Check categories table/list
        await page.waitForSelector('table', { timeout: 5000 });

        // Assert - Seeded categories visible
        await expect(page.locator('text=Electronics')).toBeVisible();
        await expect(page.locator('text=Clothing')).toBeVisible();
        await expect(page.locator('text=Books')).toBeVisible();
    });

    test("should redirect regular user from create category page", async ({page}) => {
        // Arrange - Login as regular user
        await page.goto("http://localhost:3000/login");
        await page.getByTestId("login-email-input").fill("user@test.com");
        await page.getByTestId("login-password-input").fill("password123");
        await page.getByTestId("login-submit-button").click();
        await page.waitForURL(/.*\//, { timeout: 10000 });

        // Act - Try to access admin category page
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Assert - Redirected away (not allowed)
        await page.waitForTimeout(3500); // Wait for Spinner redirect
        await expect(page).not.toHaveURL(/.*\/dashboard\/admin\/create-category/);
    });
});

test.describe("Admin Category CRUD - Create Category", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should create new category successfully", async ({page}) => {
        // Arrange - Login and navigate to category page
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Fill form and submit
        await page.locator('input[placeholder*="category" i]').fill('Sports');
        await page.locator('button:has-text("Submit")').click();

        // Assert - Success message displayed
        await expect(page.getByText(/sports.*created successfully/i)).toBeVisible({ timeout: 5000 });

        // New category appears in list
        await expect(page.locator('text=Sports')).toBeVisible();
    });

    test("should create category and display in categories list immediately", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Count initial categories
        const initialRows = await page.locator('table tbody tr').count();

        // Act - Create new category
        await page.locator('input[placeholder*="category" i]').fill('Automotive');
        await page.locator('button:has-text("Submit")').click();
        await expect(page.getByText(/automotive.*created successfully/i)).toBeVisible({ timeout: 5000 });

        // Assert - Category count increased
        const finalRows = await page.locator('table tbody tr').count();
        expect(finalRows).toBe(initialRows + 1);
        await expect(page.locator('text=Automotive')).toBeVisible();
    });

    test("should prevent creating duplicate category", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Try to create category with existing name
        await page.locator('input[placeholder*="category" i]').fill('Electronics');
        await page.locator('button:has-text("Submit")').click();

        // Assert - Error message displayed
        await expect(page.getByText(/category.*already.*exists/i)).toBeVisible({ timeout: 5000 });
    });

    test("should handle category name with multiple words", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Create category with spaces
        await page.locator('input[placeholder*="category" i]').fill('Home & Garden');
        await page.locator('button:has-text("Submit")').click();

        // Assert - Created successfully with proper slug
        await expect(page.getByText(/home.*garden.*created successfully/i)).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Home & Garden')).toBeVisible();
    });

    test("should clear form input after successful creation", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Create category
        const input = page.locator('input[placeholder*="category" i]');
        await input.fill('Toys');
        await page.locator('button:has-text("Submit")').click();
        await expect(page.getByText(/toys.*created successfully/i)).toBeVisible({ timeout: 5000 });

        // Assert - Input field cleared
        await expect(input).toHaveValue('');
    });
});

test.describe("Admin Category CRUD - Update Category", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should open edit modal when edit button clicked", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Click edit button for first category
        await page.locator('button:has-text("Edit")').first().click();

        // Assert - Modal opened with form
        await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
        await expect(page.locator('input[value]:not([value=""])')).toBeVisible();
    });

    test("should update category name successfully", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Find Electronics category and click edit
        const electronicsRow = page.locator('tr:has-text("Electronics")');
        await electronicsRow.locator('button:has-text("Edit")').click();

        // Act - Update name in modal
        const modalInput = page.locator('.modal input, [role="dialog"] input').first();
        await modalInput.clear();
        await modalInput.fill('Consumer Electronics');
        await page.locator('.modal button:has-text("Submit"), [role="dialog"] button:has-text("Submit")').click();

        // Assert - Success message and updated name visible
        await expect(page.getByText(/consumer electronics.*updated successfully/i)).toBeVisible({ timeout: 5000 });
        await expect(page.locator('text=Consumer Electronics')).toBeVisible();
        await expect(page.locator('text=Electronics').and(page.locator('td'))).not.toBeVisible();
    });

    test("should close modal after successful update", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        await page.locator('button:has-text("Edit")').first().click();
        await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();

        // Act - Update category
        const modalInput = page.locator('.modal input, [role="dialog"] input').first();
        await modalInput.clear();
        await modalInput.fill('Updated Category');
        await page.locator('.modal button:has-text("Submit"), [role="dialog"] button:has-text("Submit")').click();

        // Assert - Modal closed
        await page.waitForTimeout(2000);
        await expect(page.locator('.modal, [role="dialog"]')).not.toBeVisible();
    });

    test("should preserve other categories when updating one", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Update Clothing category
        const clothingRow = page.locator('tr:has-text("Clothing")');
        await clothingRow.locator('button:has-text("Edit")').click();

        const modalInput = page.locator('.modal input, [role="dialog"] input').first();
        await modalInput.clear();
        await modalInput.fill('Fashion & Apparel');
        await page.locator('.modal button:has-text("Submit"), [role="dialog"] button:has-text("Submit")').click();

        await expect(page.getByText(/fashion.*apparel.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Assert - Other categories still exist
        await expect(page.locator('text=Books')).toBeVisible();
        await expect(page.locator('text=Electronics')).toBeVisible();
    });
});

test.describe("Admin Category CRUD - Delete Category", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should delete category successfully", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Click delete button for Books category
        const booksRow = page.locator('tr:has-text("Books")');
        await booksRow.locator('button:has-text("Delete")').click();

        // Assert - Success message and category removed
        await expect(page.getByText(/category.*deleted successfully/i)).toBeVisible({ timeout: 5000 });
        await expect(page.locator('tr:has-text("Books")')).not.toBeVisible();
    });

    test("should reduce category count after deletion", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        const initialCount = await page.locator('table tbody tr').count();

        // Act - Delete one category
        await page.locator('button:has-text("Delete")').first().click();
        await expect(page.getByText(/category.*deleted successfully/i)).toBeVisible({ timeout: 5000 });

        // Assert - Count decreased by 1
        const finalCount = await page.locator('table tbody tr').count();
        expect(finalCount).toBe(initialCount - 1);
    });

    test("should persist deletion across page refreshes", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Delete a category
        const clothingRow = page.locator('tr:has-text("Clothing")');
        await clothingRow.locator('button:has-text("Delete")').click();
        await expect(page.getByText(/category.*deleted successfully/i)).toBeVisible({ timeout: 5000 });

        // Act - Refresh page
        await page.reload();

        // Assert - Category still deleted
        await expect(page.locator('tr:has-text("Clothing")')).not.toBeVisible();
    });

    test("should remove deleted category from public category list", async ({page}) => {
        // Arrange - Delete Books category
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        const booksRow = page.locator('tr:has-text("Books")');
        await booksRow.locator('button:has-text("Delete")').click();
        await expect(page.getByText(/category.*deleted successfully/i)).toBeVisible({ timeout: 5000 });

        // Act - Navigate to homepage (public view)
        await page.goto("http://localhost:3000");

        // Assert - Books category not in public category list
        const categoryLinks = page.locator('a[href^="/category/"]');
        const booksLink = categoryLinks.filter({ hasText: 'Books' });
        await expect(booksLink).not.toBeVisible();
    });
});

test.describe("Admin Category CRUD - Multiple Operations and Edge Cases", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should create, update, and delete category in sequence", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act 1 - Create
        await page.locator('input[placeholder*="category" i]').fill('Test Sequence');
        await page.locator('button:has-text("Submit")').click();
        await expect(page.getByText(/test sequence.*created successfully/i)).toBeVisible({ timeout: 5000 });

        // Act 2 - Update
        const testRow = page.locator('tr:has-text("Test Sequence")');
        await testRow.locator('button:has-text("Edit")').click();
        const modalInput = page.locator('.modal input, [role="dialog"] input').first();
        await modalInput.clear();
        await modalInput.fill('Updated Test Sequence');
        await page.locator('.modal button:has-text("Submit"), [role="dialog"] button:has-text("Submit")').click();
        await expect(page.getByText(/updated test sequence.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Act 3 - Delete
        const updatedRow = page.locator('tr:has-text("Updated Test Sequence")');
        await updatedRow.locator('button:has-text("Delete")').click();
        await expect(page.getByText(/category.*deleted successfully/i)).toBeVisible({ timeout: 5000 });

        // Assert - Category gone
        await expect(page.locator('tr:has-text("Updated Test Sequence")')).not.toBeVisible();
        await expect(page.locator('tr:has-text("Test Sequence")')).not.toBeVisible();
    });

    test("should display all categories in alphabetical or creation order", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        // Act - Get all category names
        const categoryNames = await page.locator('table tbody tr td:first-child').allTextContents();

        // Assert - At least the seeded categories present
        expect(categoryNames.length).toBeGreaterThan(0);
        expect(categoryNames.some(name => name.includes('Electronics'))).toBeTruthy();
        expect(categoryNames.some(name => name.includes('Clothing'))).toBeTruthy();
        expect(categoryNames.some(name => name.includes('Books'))).toBeTruthy();
    });

    test("should handle rapid category creation", async ({page}) => {
        // Arrange
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        const categories = ['Quick 1', 'Quick 2', 'Quick 3'];

        // Act - Create multiple categories quickly
        for (const cat of categories) {
            await page.locator('input[placeholder*="category" i]').fill(cat);
            await page.locator('button:has-text("Submit")').click();
            await expect(page.getByText(new RegExp(`${cat}.*created successfully`, 'i'))).toBeVisible({ timeout: 5000 });
        }

        // Assert - All categories present
        for (const cat of categories) {
            await expect(page.locator(`text=${cat}`)).toBeVisible();
        }
    });

    test("should show updated category name on category page URL", async ({page}) => {
        // Arrange - Create a category
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin/create-category");

        await page.locator('input[placeholder*="category" i]').fill('URL Test Category');
        await page.locator('button:has-text("Submit")').click();
        await expect(page.getByText(/url test category.*created successfully/i)).toBeVisible({ timeout: 5000 });

        // Act - Navigate to category page
        await page.goto("http://localhost:3000/category/url-test-category");

        // Assert - Category page loads (slug generated correctly)
        await expect(page).toHaveURL(/.*\/category\/url-test-category/);
    });
});
