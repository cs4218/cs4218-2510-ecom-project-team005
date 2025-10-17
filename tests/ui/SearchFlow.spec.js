import { test, expect } from "@playwright/test";

test.describe("Search Flow (E2E)", () => {

    test("should search for a product and see results", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        await searchInput.fill("phone");
        await searchButton.click();

        await page.waitForURL("**/search");
        await expect(page).toHaveURL(/\/search/);

        // Check the results page
        const heading = page.getByRole("heading", { name: "Search Results" });
        await expect(heading).toBeVisible();

        // Wait for products
        const productCards = page.locator(".card");
        await productCards.first().waitFor({ state: "visible" });
      //new:
        await expect(productCards.count()).resolves.toBeGreaterThan(0);
    });


    test("Can display more than 1 search-results", async ({ page }) => {
        await page.goto("http://localhost:3000");

        await page.getByRole('searchbox', { name: 'Search' }).click();
        await page.getByRole('searchbox', { name: 'Search' }).fill('on');
        await page.getByRole('searchbox', { name: 'Search' }).press('Enter');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByRole('main')).toContainText('The Law of Contract in SingaporeA bestselling book in Singapor... $ 54.99More DetailsADD TO CART');
        await expect(page.getByRole('main')).toContainText('SmartphoneA high-end smartphone... $ 999.99More DetailsADD TO CART');

    });

    test("Pressing search with empty input does nothing", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const searchBox = page.getByRole('searchbox', { name: 'Search' });
        const searchButton = page.getByRole('button', { name: 'Search' });


        await searchBox.click();


        await searchButton.click();


        await expect(page).toHaveURL("http://localhost:3000/");

    });


    test("should handle no-results case gracefully", async ({ page }) => {
        await page.goto("http://localhost:3000");

        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("nonexistentproduct");
        await page.getByRole("button", { name: "Search" }).click();

        await page.waitForURL("**/search");
        await expect(page.getByText("No Products Found")).toBeVisible();
    });

});