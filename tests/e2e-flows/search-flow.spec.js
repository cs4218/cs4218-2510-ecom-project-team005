import { test, expect } from '../fixtures/testData.js';

const baseUrl = "http://localhost:3000";

test.describe("E2E - Search Flow", () => {

    test.beforeEach(async ({ testData, page }) => {
        await testData.seedAll(); // reset memory server and seed data
        await page.goto(baseUrl);
    });

    // --- BASIC UI TESTS ---
    test("renders search input and button", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        await expect(searchInput).toBeVisible();
        await expect(searchButton).toBeVisible();
    });

    test("updates value when typing", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("Laptop");
        await expect(searchInput).toHaveValue("Laptop");
    });

    test("trims whitespace before submitting", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        await searchInput.fill("   phone   ");
        await searchButton.click();

        await page.waitForURL("**/search");
        await expect(page).toHaveURL(/\/search/);
        expect(page.url()).not.toContain(" ");
    });

    test("empty search input does nothing", async ({ page }) => {
        const searchButton = page.getByRole("button", { name: "Search" });
        await searchButton.click();
        await expect(page).toHaveURL(`${baseUrl}/`);
    });

    // --- MAIN SEARCH FLOW ---
    test("searches for a seeded product and shows results", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("phone");
        await page.getByRole("button", { name: "Search" }).click();

        await page.waitForURL("**/search");
        await expect(page.getByRole("heading", { name: /Search Results/i })).toBeVisible();

        const productCards = page.locator(".card");
        await expect(productCards.first()).toBeVisible();
        await expect(await productCards.count()).toBeGreaterThan(0);
    });

    test("shows multiple product cards for a broad query", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("sm"); // matches only Smartphone and Smartwatch
        await page.getByRole("button", { name: "Search" }).click();

        await page.waitForURL("**/search");
        const productCards = page.locator(".card");
        await expect(await productCards.count()).toBe(2); // exactly two products

        const main = page.getByRole("main");
        await expect(main).toContainText("Smartphone");
        await expect(main).toContainText("Smartwatch");
    });


    test("shows 'No Products Found' for an invalid query", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("nonexistentproduct");
        await page.getByRole("button", { name: "Search" }).click();

        await page.waitForURL("**/search");
        await expect(page.getByText(/No Products Found/i)).toBeVisible();
    });

    test("can perform consecutive searches and update results", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        // First search
        await searchInput.fill("phone");
        await searchButton.click();
        await page.waitForURL("**/search");
        await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();


        // Second search
        await searchInput.fill("laptop");
        await searchButton.click();
        await page.waitForURL("**/search");

        await expect(page.getByRole('heading', { name: 'Laptop' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Smartphone' })).not.toBeVisible();
    });

    test("search results reset on page reload", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        await searchInput.fill("phone");
        await searchButton.click();
        await page.waitForURL("**/search");
        await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();


        await page.reload();
        // Results should be cleared after reload if not persisted
        await expect(page.locator(".card").first()).not.toBeVisible();
    });

    // --- PAGE CONTENT & BUTTONS ---
    test("each product card shows details and buttons", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("phone");
        await page.getByRole("button", { name: "Search" }).click();

        await page.waitForURL("**/search");
        const firstCard = page.locator(".card").first();

        await expect(firstCard).toBeVisible();
        await expect(firstCard.getByRole("button", { name: "More Details" })).toBeVisible();
        await expect(firstCard.getByRole("button", { name: "ADD TO CART" })).toBeVisible();


    });
});
