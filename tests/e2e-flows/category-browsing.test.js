import { test, expect } from '../fixtures/testData.js';

test.describe.configure({mode: "parallel"});

test.describe("Navigation to category pages", () => {
    test.beforeEach(async ({page})=> {
        await page.goto("http://localhost:3000")
    })

    test("should show 'no categories' message when database is empty", async ({page, testData}) => {
        await testData.clearDatabase();
        
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'All Categories' }).click();
        await expect(page.getByTestId("no-categories")).toHaveText("No categories available at the moment.")
    });

    test("should list the individual categories that exist and navigate correctly", async ({page, testData}) => {
        await page.goto("http://localhost:3000");
        await page.getByRole('link', { name: 'Categories' }).click();
        await page.getByRole('link', { name: 'All Categories' }).click();
        
        await expect(page.getByRole('link', { name: 'Electronics' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Clothing' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Books' })).toBeVisible();
        
        await page.getByRole('link', { name: 'Electronics' }).click();
        await expect(page).toHaveURL(/.*category\/electronics/);
    });
})


test.describe("Category Product Page", () => {
    test.beforeEach(async ({page, testData}) => {
        await page.goto("http://localhost:3000");
        await page.evaluate(() => localStorage.clear());
    });

    test("should show 'no products' message when category has no products", async ({page, testData}) => {
        await page.goto("http://localhost:3000/category/home-garden");
        await expect(page.getByTestId("no-products")).toHaveText("No products available in this category.");
    });

    test("should add product to cart successfully", async ({page}) => {
        await page.goto("http://localhost:3000/category/electronics");   
        await expect(page.getByTestId("products-container")).toBeVisible();
        
        const firstProductSlug = await page.locator('[data-testid^="product-card-"]').first().getAttribute('data-testid');
        const slug = firstProductSlug.replace('product-card-', '');
        
        await page.getByTestId(`add-to-cart-${slug}`).click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();
        
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(1);
        expect(cartItems[0].slug).toBe(slug);
    });

    test("should navigate to product details page when 'More Details' is clicked", async ({page}) => {
        await page.goto("http://localhost:3000/category/electronics");
        await expect(page.getByTestId("products-container")).toBeVisible();
        
        const firstProductSlug = await page.locator('[data-testid^="product-card-"]').first().getAttribute('data-testid');
        const slug = firstProductSlug.replace('product-card-', '');
        
        await page.getByTestId(`more-details-${slug}`).click();
        await expect(page).toHaveURL(new RegExp(`.*\\/product\\/${slug}`));
    });

    test("should load more products with pagination (full page + remaining items)", async ({page}) => {
        await page.goto("http://localhost:3000/category/electronics");
        await expect(page.getByTestId("products-container")).toBeVisible();
        await expect(page.getByTestId("product-count")).toContainText("8 result found");
        const initialProducts = await page.getByTestId(/^product-card-/).count();
        expect(initialProducts).toBe(6);
        await expect(page.getByTestId("load-more-button")).toBeVisible();
        await page.getByTestId("load-more-button").click();
        

        await page.waitForTimeout(500); 
        
        const allProducts = await page.getByTestId(/^product-card-/).count();
        expect(allProducts).toBe(8);
        
        await expect(page.getByTestId("load-more-button")).not.toBeVisible();
    });

    test("should handle uneven pagination correctly", async ({page}) => {
        await page.goto("http://localhost:3000/category/electronics");
        
        await expect(page.getByTestId("products-container")).toBeVisible();
        
        const firstPageProducts = await page.getByTestId(/^product-card-/).count();
        expect(firstPageProducts).toBe(6);
        
        const firstProductSlug = await page.locator('[data-testid^="product-card-"]').first().getAttribute('data-testid');
        const sixthProductSlug = await page.locator('[data-testid^="product-card-"]').nth(5).getAttribute('data-testid');
        
        await page.getByTestId("load-more-button").click();
        
        await page.waitForTimeout(500);
        
        const totalProducts = await page.getByTestId(/^product-card-/).count();
        expect(totalProducts).toBe(8);
        
        await expect(page.getByTestId(firstProductSlug)).toBeVisible();
        await expect(page.getByTestId(sixthProductSlug)).toBeVisible();
    });

    test("should display correct product count for category", async ({page}) => {
        await page.goto("http://localhost:3000/category/clothing");
        
        await expect(page.getByTestId("product-count")).toContainText("2 result found");
        
        await expect(page.getByTestId("load-more-button")).not.toBeVisible();
        
        const productCount = await page.getByTestId(/^product-card-/).count();
        expect(productCount).toBe(2);
    });

    test("should add multiple products to cart", async ({page}) => {
        await page.goto("http://localhost:3000/category/clothing");
        
        const firstProductSlug = await page.locator('[data-testid^="product-card-"]').first().getAttribute('data-testid');
        const firstSlug = firstProductSlug.replace('product-card-', '');
        
        const secondProductSlug = await page.locator('[data-testid^="product-card-"]').nth(1).getAttribute('data-testid');
        const secondSlug = secondProductSlug.replace('product-card-', '');
        
        await page.getByTestId(`add-to-cart-${firstSlug}`).click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();
        
        await page.getByTestId(`add-to-cart-${secondSlug}`).click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();
        
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(2);
    });
});