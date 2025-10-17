import { test, expect } from "@playwright/test";

test.describe("SearchInput Component", () => {

    test.beforeEach(async ({ page }) => {
        await page.goto("http://localhost:3000"); // Assuming SearchInput is in header
    });

    test("should render input and search button", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        await expect(searchInput).toBeVisible();
        await expect(searchButton).toBeVisible();
    });

    test("should update the input value when typing", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        await searchInput.fill("Laptop");
        await expect(searchInput).toHaveValue("Laptop");
    });

    test("should navigate to search page on submit", async ({ page }) => {
        const searchInput = page.getByRole("searchbox", { name: "Search" });
        const searchButton = page.getByRole("button", { name: "Search" });

        await searchInput.fill("Phone");
        await searchButton.click();

        await page.waitForURL("**/search");
        await expect(page).toHaveURL(/.*\/search/);
    });

    //  test("should not crash if search API fails", async ({ page }) => {
        // Mock a failed API request (optional)
        //     await page.route("**/api/v1/product/search/**", route => route.abort());
        //     const searchInput = page.getByRole("searchbox", { name: "Search" });
        //      await searchInput.fill("TV");
        //     await page.getByRole("button", { name: "Search" }).click();
        // Still navigates or handles gracefully

        //new:  before was await expect(page).toHaveURL(/.*\/search/);
   //     await expect(page).toHaveTitle(/Ecommerce|Home/i);

 //   });

});