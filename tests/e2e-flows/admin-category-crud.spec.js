// // HOUQINGSHAN e2e test for Admin Category CRUD Operations
import { test, expect } from "../fixtures/testData.js";

test.describe.configure({ mode: "serial" }); // keep memory DB state ordered

const baseUrl = "http://localhost:3000";

function rowFor(page, name) {
  // find the table row whose <td> exactly matches the name (case-insensitive)
  return page.locator("table tbody tr", {
    has: page.getByRole("cell", { name: new RegExp(`^${name}$`, "i") }),
  });
}

// --- helpers ---
async function uiLoginAsAdmin(page) {
  await page.goto('http://localhost:3000/login');

  await page.getByTestId('login-email-input').fill('admin@test.com');
  await page.getByTestId('login-password-input').fill('password123');

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByTestId('login-submit-button').click(),
  ]);

  // land on home or dashboard
  await expect(page).toHaveURL(/(\/$|\/dashboard)/i);
}

async function gotoCreateCategoryViaUI(page) {
  // open the user dropdown (shows admin email/name)
  const userToggle = page
    .locator('.nav-item.dropdown .dropdown-toggle')
    .filter({ hasText: /admin@test\.com|admin/i });

  await expect(userToggle).toBeVisible();
  await userToggle.click();

  // click Dashboard
  const userMenu = page.locator('.dropdown-menu').last();
  await expect(userMenu).toBeVisible();

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    userMenu.getByRole('link', { name: /dashboard/i }).click(),
  ]);

  // should be /dashboard/admin (admin role)
  await expect(page).toHaveURL(/\/dashboard\/admin\/?$/i);

  // left sidebar → "Create Category" (AdminMenu)
  // scope to the left column to avoid hitting center content links
  const leftNav = page.locator('.col-md-3');
  await expect(leftNav).toBeVisible();

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    leftNav.getByRole('link', { name: /create category/i }).first().click(),
  ]);

  // now on the create-category screen
  await expect(page).toHaveURL(/\/dashboard\/admin\/create-category/i);
  await expect(page.getByRole('heading', { name: /manage category/i })).toBeVisible();
}

test.describe("Admin • Category CRUD (memory server, no external services)", () => {
  test.beforeEach(async ({ testData, page }) => {
    await testData.seedAll();          // resets mongodb-memory-server and seeds admin, etc.
    await page.goto(baseUrl);          // front-end served by Playwright webServer in config
  });

  test("Create → Update → Delete category", async ({ page }) => {
    const initialName = `TestCat-${Date.now()}`;
    const updatedName = `${initialName}-v2`;

    // 1) Login
    await uiLoginAsAdmin(page);

    // 2) Navigate to Admin → Create Category
    await gotoCreateCategoryViaUI(page);

    // 3) CREATE
    const createFormScope = page.locator(".p-3.w-50"); // the top form card
    await createFormScope.getByPlaceholder(/enter new category/i).fill(initialName);
    await Promise.all([
      page.waitForLoadState("networkidle"),
      createFormScope.getByRole("button", { name: /^submit$/i }).click(),
    ]);
    await expect(rowFor(page, initialName)).toBeVisible();

    // 4) UPDATE (AntD modal -> use the accessible dialog role)
    await rowFor(page, initialName).getByRole("button", { name: /edit/i }).click();

    const dialog = page.getByRole("dialog"); // AntD sets role="dialog"
    await expect(dialog).toBeVisible();

    const modalInput = dialog.getByPlaceholder(/enter new category/i);
    await modalInput.click();
    await modalInput.fill(updatedName);

    await Promise.all([
      page.waitForLoadState("networkidle"),
      dialog.getByRole("button", { name: /^submit$/i }).click(),
    ]);

    await expect(dialog).toBeHidden(); // wait until modal fully closes

    await expect(rowFor(page, initialName)).toHaveCount(0);
    await expect(rowFor(page, updatedName)).toBeVisible();

    // 5) DELETE
    await rowFor(page, updatedName).getByRole("button", { name: /delete/i }).click();

    await expect(rowFor(page, updatedName)).toHaveCount(0);

  });
});