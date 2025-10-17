import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
    const mockProducts = [
        { _id: "1", name: "Smartphone", description: "Test phone", price: 499 },
        { _id: "2", name: "Laptop", description: "Test laptop", price: 999 },
    ];

    test.beforeEach(async ({ page }) => {
        // Intercept search API
        await page.route("**/api/v1/product/search/**", (route) => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(mockProducts),
            });
        });
    });

    test("should display 'No Products Found' when no results", async ({ page }) => {
        await page.route("**/api/v1/product/search/**", (route) => {
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([]),
            });
        });
        await page.goto("http://localhost:3000/search?keyword=none");
        await expect(page.getByText("No Products Found")).toBeVisible();
    });

    test("should show correct heading", async ({ page }) => {
        await page.goto("http://localhost:3000/search");
        await expect(page.getByRole("heading", { name: "Search Results" })).toBeVisible();
    });

    test("should display product cards when results exist", async ({ page }) => {
        await page.goto("http://localhost:3000/search");

        // Trigger search programmatically if component requires it
        await page.fill('input[placeholder="Search"]', "anything");
        await page.click('button:has-text("Search")');

        const cards = page.locator(".card");
        await expect(cards.first()).toBeVisible();
        await expect(cards).toHaveCount(mockProducts.length);
    });

/*    test("should display name, description, and price on each product card", async ({ page }) => {
        await page.goto("http://localhost:3000/search");
        await page.fill('input[placeholder="Search"]', "anything");
        await page.click('button:has-text("Search")');

        await page.waitForTimeout(2000); // give React time
        await page.screenshot({ path: "debug.png" });

        const firstCard = page.locator(".card").first();
        await expect(firstCard.locator(".card-title")).toHaveText(mockProducts[0].name);
        await expect(firstCard.locator(".card-text")).toHaveText(`${mockProducts[0].description.substring(0, 30)}...`);
        await expect(firstCard.locator(".card-text").nth(1)).toHaveText(` $ ${mockProducts[0].price}`);
    });*/

    test("should have working 'More Details' and 'ADD TO CART' buttons", async ({ page }) => {
        await page.goto("http://localhost:3000/search");
        await page.fill('input[placeholder="Search"]', "anything");
        await page.click('button:has-text("Search")');

        const firstCard = page.locator(".card").first();
        const moreDetails = firstCard.getByRole("button", { name: "More Details" });
        const addToCart = firstCard.getByRole("button", { name: "ADD TO CART" });

        await expect(moreDetails).toBeVisible();
        await expect(addToCart).toBeVisible();
    });
});
