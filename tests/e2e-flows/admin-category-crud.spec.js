// HOUQINGSHAN e2e test for Admin Category CRUD Operations
import { test, expect} from '@playwright/test';

// --- helpers ---
async function uiLogin(page) {
  await page.goto('/login');

  await page.getByTestId('login-email-input').fill('admin@test.sg');
  await page.getByTestId('login-password-input').fill('admin@test.sg');

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByTestId('login-submit-button').click(),
  ]);

  // Usually redirected to home or dashboard
  await expect(page).toHaveURL(/(\/$|\/dashboard)/i);
}

async function gotoAdminCreateCategory(page) {
  const userToggle = page.locator('.nav-item.dropdown .dropdown-toggle').filter({ hasText: /admin/i });
  await expect(userToggle).toBeVisible();
  await userToggle.click();

  const menu = page.locator('.dropdown-menu').last();
  await expect(menu).toBeVisible();

  // Admin dashboard
  await menu.getByRole('link', { name: /dashboard/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/(admin|user)\/?$/i);

  // In the left side AdminMenu, click "Create Category"
  await page.getByRole('link', { name: /create category/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/admin\/create-category/i);

  // Sanity: page heading
  await expect(page.getByRole('heading', { name: /manage category/i })).toBeVisible();
}

// Returns the table row locator for a category name
function rowFor(page, name) {
  // Scope by the table and find the row that contains the category name
  return page.locator('table tbody tr', { has: page.getByRole('cell', { name: new RegExp(`^${name}$`, 'i') }) });
}

test.describe('Admin • Category CRUD', () => {
  test('Create → Update → Delete category', async ({ page }) => {
    const initialName = `TestCat-${Date.now()}`;
    const updatedName = `${initialName}-v2`;

    // 1) Login
    await uiLogin(page);

    // 2) Go to Admin → Create Category
    await gotoAdminCreateCategory(page);

    // 3) CREATE
    // Fill the "Enter new category" input (from CategoryForm) and submit
    await page.getByPlaceholder(/enter new category/i).fill(initialName);
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByRole('button', { name: /^submit$/i }).click(),
    ]);

    // Expect the new category to appear in the table
    await expect(rowFor(page, initialName)).toBeVisible();

    // 4) UPDATE
    const r1 = rowFor(page, initialName);
    await r1.getByRole('button', { name: /edit/i }).click();

    // --- Wait for the AntD modal using its ARIA role ---
    const dialog = page.getByRole('dialog');          // = the opened modal
    await expect(dialog).toBeVisible();               // no more hidden .ant-modal-root issue

    // Edit inside the dialog only (avoid hitting the background form)
    const modalInput = dialog.getByPlaceholder(/enter new category/i);
    await modalInput.click();
    await modalInput.fill(updatedName);

    // Submit inside the dialog
    await Promise.all([
      page.waitForLoadState('networkidle'),
      dialog.getByRole('button', { name: /^submit$/i }).click(),
    ]);

    // Wait for modal to close before asserting the table update
    await expect(dialog).toBeHidden();

    await expect(rowFor(page, initialName)).toHaveCount(0);
    await expect(rowFor(page, updatedName)).toBeVisible();

    // 5) DELETE
    const r2 = rowFor(page, updatedName);
    await r2.getByRole('button', { name: /delete/i }).click();

    // After delete, row should disappear
    await expect(rowFor(page, updatedName)).toHaveCount(0);
  });
});