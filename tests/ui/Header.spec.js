import { test, expect } from "../fixtures/testData.js";

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


test.describe.configure({ mode: "serial" });

const baseUrl = "http://localhost:3000";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function uiLogin(page) {
  await page.goto(`${baseUrl}/login`);

  await page.getByTestId("login-email-input").fill("admin@test.com");
  await page.getByTestId("login-password-input").fill("password123");

  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByTestId("login-submit-button").click(),
  ]);

  await expect(page).toHaveURL(/(\/$|\/dashboard)/i);
}

async function getUserToggle(page) {
  // Read what the header will actually render
  const display = await page.evaluate(() => {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return obj?.user?.name || obj?.user?.email || null;
    } catch {
      return null;
    }
  });

  if (display) {
    const rx = new RegExp(`^${escapeRegex(display)}$`, "i");
    const toggleByText = page.getByRole("link", { name: rx });
    if (await toggleByText.count()) return toggleByText;
  }

  // Fallback: pick the dropdown toggle that is NOT "Categories"
  const toggles = page.locator(".nav-item.dropdown .dropdown-toggle");
  const count = await toggles.count();
  for (let i = 0; i < count; i++) {
    const txt = (await toggles.nth(i).innerText()).trim();
    if (!/^\s*categories\s*$/i.test(txt)) return toggles.nth(i);
  }
  // Final fallback (shouldn’t happen): second dropdown (first is Categories)
  return toggles.nth(1);
}

test.describe("Header logged-in user menu", () => {
  test.beforeEach(async ({ testData, page }) => {
    await testData.seedAll();
    await page.goto(baseUrl);
  });

  test("user dropdown → Dashboard → Logout", async ({ page }) => {
    // 1) Login through real UI
    await uiLogin(page);

    // 2) Locate the user dropdown toggle robustly
    const userToggle = await getUserToggle(page);
    await expect(userToggle).toBeVisible();

    // 3) Open dropdown and go to Dashboard
    await userToggle.click();
    const menu = page.locator(".dropdown-menu").last();
    await expect(menu).toBeVisible();

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      menu.getByRole("link", { name: /dashboard/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/dashboard\/(admin|user)\/?$/i);

    // 4) Back, open again, Logout → /login and auth cleared
    await page.goBack();
    await userToggle.click();
    await expect(menu).toBeVisible();

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle" }),
      menu.getByRole("link", { name: /logout/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/login$/i);

    const auth = await page.evaluate(() => localStorage.getItem("auth"));
    expect(auth).toBeNull();
  });
});