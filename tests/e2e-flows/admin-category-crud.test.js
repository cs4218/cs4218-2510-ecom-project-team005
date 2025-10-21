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
        // Arrange - Login as admin and navigate to create category page
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Assert - Create category page loaded
        await expect(page.getByRole('heading', { name: 'Manage Category' })).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/admin\/create-category/);
    });

    test("should display category form with input field and button", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);
        
        // Act - Navigat to admin create category page
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Act & Assert - Form elements present
        await expect(page.getByRole('textbox', { name: 'Enter new category' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
    });

    test("should display existing categories list", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);
        
        // Act - Navigate to admin create category page
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Assert - Seeded categories visible
        await expect(page.getByRole('cell', { name: 'Electronics' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Clothing' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Books' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Home & Garden' })).toBeVisible();
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
        await expect(page.getByTestId("login-email-input")).toBeVisible(); 
        await expect(page.getByTestId("login-password-input")).toBeVisible(); 
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
        
        // Act - Fill form and submit
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('Accessories');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Assert
        // Success message shown
        await expect(page.getByText('Accessories is created')).toBeVisible();

        // New category appears in list
        await expect(page.getByRole('cell', { name: 'Accessories' })).toBeVisible();
        
    });

    test("should prevent creating duplicate category", async ({page}) => {
       // Arrange - Login and navigate to category page
        await loginAdmin(page);
        
        // Act - Fill form and submit
        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('Electronics');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Assert - Error message displayed
        await expect(page.getByText('Something went wrong in input')).toBeVisible();
    });

    test("should clear form input after successful creation", async ({page}) => {
        // Arrange - Login and navigate to category page
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Act - Create category
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('Toys');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Assert - Input field cleared
        await expect(page.getByRole('textbox', { name: 'Enter new category' })).toHaveValue('');
    });
});

test.describe("Admin Category CRUD - Update Category", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should open edit modal when edit button clicked", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Act - Click edit button for first category
        await page.getByRole('button', { name: 'Edit' }).first().click();

        // Assert - Modal opened with form
        await expect(page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })).toBeVisible();
    });

    test("should update category name successfully", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Find Electronics category and click edit
        const electronicsRow = page.getByRole('row', { name: /Electronics/i });
        await electronicsRow.getByRole('button', { name: 'Edit' }).click();

        // Act - Update name in modal
        const modalInput = page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' });
        await modalInput.clear();
        await modalInput.fill('Consumer Electronics');
        await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();


        // Assert - Success message and updated name visible
        await expect(page.getByText('Consumer Electronics is updated')).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Consumer Electronics' })).toBeVisible();
    });

    test("should preserve other categories when updating one", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Act - Update Clothing category
        const clothingRow = page.getByRole('row', { name: /Clothing/i });
        await clothingRow.getByRole('button', { name: 'Edit' }).click();

        const modalInput = page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' });
        await modalInput.clear();
        await modalInput.fill('Fashion & Apparel');
        await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

        await expect(page.getByText('Fashion & Apparel is updated')).toBeVisible();

        // Assert - Other categories still exist
        await expect(page.getByRole('cell', { name: 'Books' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Electronics' })).toBeVisible();
    });
});

test.describe("Admin Category CRUD - Delete Category", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should delete category successfully", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Act - Click delete button for Books category
        const booksRow = page.getByRole('row', { name: /Books/i });
        await booksRow.getByRole('button', { name: 'Delete' }).click();

        // Assert - Success message and category removed
        await expect(page.getByText('category is deleted')).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Books', exact: true })).not.toBeVisible();
    });

    // uncaught error when refresh: bug fix later
    test("should persist deletion across page refreshes", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Delete a category
        // Act - Click delete button for Books category
        const acsRow = page.getByRole('row', { name: /Accessories/i });
        await acsRow.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('category is deleted')).toBeVisible();

        // Act - Refresh page
        await page.reload();

        // Assert - Category still deleted
        await expect(page.getByRole('cell', { name: 'Clothing', exact: true })).not.toBeVisible();
    });

    test("should remove deleted category from public category list", async ({page}) => {
        // Arrange - Login, navigate, and delete Books
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        const electronicsRow = page.getByRole('row', { name: /Electronics/i });
        await electronicsRow.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('category is deleted')).toBeVisible();

        // Act - Navigate to homepage (public view)
        await page.getByRole('link', { name: 'Home' }).click();

        // Assert - Books category not in filter checkboxes
        await expect(page.getByRole('main').getByText('Electronics')).not.toBeVisible();
    });
});

test.describe("Admin Category CRUD - Multiple Operations and Edge Cases", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should create, update, and delete category in sequence", async ({page}) => {
        // Arrange - Login and navigate
        await loginAdmin(page);

        await page.getByRole('button', { name: 'Test Admin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();

        // Act 1 - Create
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('Test Sequence');
        await page.getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Test Sequence is created')).toBeVisible();

        // Act 2 - Update
        const testRow = page.getByRole('row', { name: /Test Sequence/i });
        await testRow.getByRole('button', { name: 'Edit' }).click();
        const modalInput = page.getByRole('dialog').getByRole('textbox', { name: 'Enter new category' })
        await modalInput.clear();
        await modalInput.fill('Updated Test Sequence');
        await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
        await expect(page.getByText('Updated Test Sequence is updated')).toBeVisible();

        // Act 3 - Delete
        const updatedRow = page.getByRole('row', { name: /Updated Test Sequence/i });
        await updatedRow.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('category is deleted')).toBeVisible();

        // Assert - Category gone
        await expect(page.getByRole('cell', { name: 'Updated Test Sequence', exact: true })).not.toBeVisible();
        await expect(page.getByRole('cell', { name: 'Test Sequence', exact: true })).not.toBeVisible();
    });
});
