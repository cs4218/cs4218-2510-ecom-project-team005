import { test, expect } from '../fixtures/testData.js';

test.describe.configure({mode: "parallel"});

test.describe("Product Details Page", () => {
    test.beforeEach(async ({page}) => {
        await page.goto("http://localhost:3000");
        await page.evaluate(() => localStorage.clear());
    });

    test("should display all product information correctly", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/laptop");
        
        //act
        await page.waitForSelector('[data-testid="product-name"]');
        
        //assert
        await expect(page.getByTestId("product-name")).toContainText("Laptop");
        await expect(page.getByTestId("product-description")).toContainText("High-performance laptop for professionals and gamers");
        await expect(page.getByTestId("product-price")).toContainText("$999.00");
        await expect(page.getByTestId("product-category")).toContainText("Electronics");
        await expect(page.getByTestId("product-image")).toBeVisible();
    });

    test("should add main product to cart successfully", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/laptop");
        await page.waitForSelector('[data-testid="add-to-cart-button"]');
        
        //act
        await page.getByTestId("add-to-cart-button").click();
        
        //assert
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(1);
        expect(cartItems[0].slug).toBe('laptop');
    });

    test("should display related products from same category", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/laptop");
        
         //act
        await page.waitForSelector('[data-testid^="related-product-card-"]');
        
        //assert
        const relatedProductCards = await page.getByTestId(/^related-product-card-/).count();
        expect(relatedProductCards).toBeGreaterThan(0);
        expect(relatedProductCards).toBeLessThanOrEqual(7);
        await expect(page.getByTestId("related-products")).toBeVisible();
    });

    test("should show no related products message when category has only one product", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/javascript-book");
        
        //act
        await page.waitForSelector('[data-testid="no-similar-products"]');
        
        //assert
        await expect(page.getByTestId("no-similar-products")).toBeVisible();
        await expect(page.getByTestId("no-similar-products")).toHaveText("No Similar Products found");
    });

    test("should navigate to related product details when More Details is clicked", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/laptop");
        await page.waitForSelector('[data-testid^="related-product-card-"]');
        
        //act
        const firstRelatedProductCard = await page.locator('[data-testid^="related-product-card-"]').first().getAttribute('data-testid');
        const relatedSlug = firstRelatedProductCard.replace('related-product-card-', '');
        await page.getByTestId(`related-more-details-${relatedSlug}`).click();
        
        //assert
        await expect(page).toHaveURL(new RegExp(`.*\\/product\\/${relatedSlug}`));
        await page.waitForSelector('[data-testid="product-name"]');
        await expect(page.getByTestId("product-name")).toBeVisible();
    });

    test("should add related product to cart successfully", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/laptop");
        await page.waitForSelector('[data-testid^="related-product-card-"]');
        
        //act
        const firstRelatedProductCard = await page.locator('[data-testid^="related-product-card-"]').first().getAttribute('data-testid');
        const relatedSlug = firstRelatedProductCard.replace('related-product-card-', '');
        await page.getByTestId(`related-add-to-cart-${relatedSlug}`).click();
        
        //assert
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(1);
        expect(cartItems[0].slug).toBe(relatedSlug);
    });

    test("should add both main and related products to cart", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/t-shirt");
        await page.waitForSelector('[data-testid="add-to-cart-button"]');
        
        //act
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();
        
        await page.waitForSelector('[data-testid^="related-product-card-"]');
        const firstRelatedProductCard = await page.locator('[data-testid^="related-product-card-"]').first().getAttribute('data-testid');
        const relatedSlug = firstRelatedProductCard.replace('related-product-card-', '');
        await page.getByTestId(`related-add-to-cart-${relatedSlug}`).click();
        
        //assert
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(2);
        expect(cartItems[0].slug).toBe('t-shirt');
        expect(cartItems[1].slug).toBe(relatedSlug);
    });

    test("should show correct number of related products for clothing category", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/product/t-shirt");
        
        //act
        await page.waitForSelector('[data-testid="related-product-card-jeans"]');
        
        //assert
        const relatedProductCards = await page.getByTestId(/^related-product-card-/).count();
        expect(relatedProductCards).toBe(1);
        await expect(page.getByTestId("related-product-card-jeans")).toBeVisible();
    });
});
