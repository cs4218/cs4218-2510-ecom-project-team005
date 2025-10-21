import { test, expect } from '@playwright/test';

const MOCK_CATEGORIES = [
  { _id: '1', name: 'Electronics', slug: 'electronics' },
  { _id: '2', name: 'Book',        slug: 'book' },
  { _id: '3', name: 'Clothing',    slug: 'clothing' },
];

test.describe('Header (anonymous user)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock categories endpoint used by useCategory()
    await page.route('**/api/v1/category/get-category', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, category: MOCK_CATEGORIES }),
      });
    });
  });

  test('renders header, brand, search, categories, auth links, and cart', async ({ page }) => {
    await page.goto('/');

    // Brand link (uses text "Virtual Vault" with emoji)
    await expect(page.getByRole('link', { name: /virtual vault/i })).toBeVisible();

    // Search input + button (from <SearchInput/>)
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /search/i })).toBeVisible();

    // Main nav links (Home, Categories, Register, Login, Cart)
    await expect(page.getByRole('link', { name: /^home$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^categories$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^register$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^login$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^cart/i })).toBeVisible();
  });

  test('search: user can type a query and submit', async ({ page }) => {
    await page.goto('/');

    await page.getByPlaceholder(/search/i).fill('nov');
    await page.getByRole('button', { name: /search/i }).click();

    // Adjust this assertion to your SearchInput’s actual navigation behavior.
    // Many implementations route to /search with a query or state.
    await expect(page).toHaveURL(/\/search/i);
  });

  test('categories: opens dropdown, navigates to All Categories and a specific category', async ({ page }) => {
    await page.goto('/');

    // Open the Categories dropdown (Bootstrap)
    const categoriesToggle = page.getByRole('link', { name: /^categories$/i });
    await categoriesToggle.click();

    const menu = page.locator('.dropdown-menu').first();
    await expect(menu).toBeVisible();

    // All Categories
    await menu.getByRole('link', { name: /all categories/i }).click();
    await expect(page).toHaveURL(/\/categories$/i);

    // Back, open again, choose a specific category
    await page.goBack();
    await categoriesToggle.click();
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: /electronics/i }).click();
    await expect(page).toHaveURL(/\/category\/electronics$/i);
  });
});


// we are doing real UI login here because we want to test the second dropdown of the Header with logged-in user menu
async function uiLogin(page) {
  await page.goto('/login');

  // Fill the form using your data-testids
  await page.getByTestId('login-email-input').fill('admin@test.sg');
  await page.getByTestId('login-password-input').fill('admin@test.sg');

  // Submit and wait for the app to finish navigating/fetching
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByTestId('login-submit-button').click(),
  ]);

  // Most apps redirect to "/" after login
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Header logged-in user menu (integration)', () => {
  test('user dropdown -> Dashboard, then Logout', async ({ page }) => {
    // 1) Login through UI (real backend)
    await uiLogin(page);

    // 2) Find the user dropdown toggle in the header
    const userToggle = page
      .locator('.nav-item.dropdown .dropdown-toggle')
      .filter({ hasText: /admin/i });

    await expect(userToggle).toBeVisible();

    // 3) Open dropdown and click "Dashboard"
    await userToggle.click();
    const userMenu = page.locator('.dropdown-menu').last();
    await expect(userMenu).toBeVisible();

    await userMenu.getByRole('link', { name: /dashboard/i }).click();
    // Works for admin or user role
    await expect(page).toHaveURL(/\/dashboard\/(admin|user)\/?$/i);

    // 4) Go back, open again, click "Logout" -> land on /login
    await page.goBack();
    await userToggle.click();
    await expect(userMenu).toBeVisible();

    await userMenu.getByRole('link', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login$/i);
  });
});
