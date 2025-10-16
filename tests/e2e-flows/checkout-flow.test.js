import { test, expect } from '../fixtures/testData.js';

test.describe.configure({mode: "serial"});

// Helper functions
async function loginUser(page, email, password) {
    await page.goto("http://localhost:3000/login");
    await page.getByTestId("login-email-input").fill(email);
    await page.getByTestId("login-password-input").fill(password);
    await page.getByTestId("login-submit-button").click();

    await page.waitForURL(/.*\//, { timeout: 10000 });
    
    await page.waitForFunction(() => {
        const auth = localStorage.getItem('auth');
        return auth !== null && auth !== 'undefined';
    }, { timeout: 10000 });
    await page.waitForTimeout(1000);
}

async function addProductToCart(page, productSlug) {
    await page.goto(`http://localhost:3000/product/${productSlug}`);
    await page.waitForSelector('[data-testid="add-to-cart-button"]');
    await page.getByTestId("add-to-cart-button").click();
    await expect(page.getByText("Item Added to cart").first()).toBeVisible();
}

async function updateUserAddress(page, address) {
    await page.goto("http://localhost:3000/dashboard/user/profile");
    await page.waitForSelector('[data-testid="profile-address-input"]');
    await page.getByTestId("profile-address-input").clear();
    await page.getByTestId("profile-address-input").fill(address);
    await page.getByTestId("profile-update-button").click();
    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
}

async function fillBraintreePayment(page) {
    // Wait for Braintree DropIn to load
    await page.getByRole('button', { name: 'Paying with Card' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).click();
    await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4111111111111111');
    
    // Fill expiration date
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).click();
    await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('12/26');

    
    // Fill CVV
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).click();
    await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('123');
}

test.describe("Checkout Flow - Successful Scenarios", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test("should complete full checkout flow for logged-in user with address", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "laptop");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-laptop"]');
        await expect(page.getByTestId("cart-total")).toContainText("$999.00");
        await expect(page.getByTestId("current-address")).toBeVisible();
        
        // Fill payment information
        await fillBraintreePayment(page);
        
        // Wait for payment button to be enabled
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        
        //assert
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        await expect(page.getByText("Payment Completed Successfully")).toBeVisible();
        
        // Verify cart is cleared
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(0);
        
        // Verify order appears on orders page
        await page.waitForSelector('[data-testid="order-0"]');
        await expect(page.getByTestId("order-payment-0")).toContainText("Success");
        await expect(page.getByTestId("order-quantity-0")).toContainText("1");
    });

    test("should checkout with multiple products and calculate total correctly", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "t-shirt");
        await addProductToCart(page, "jeans");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-t-shirt"]');
        await page.waitForSelector('[data-testid="cart-item-jeans"]');
        
        //assert
        await expect(page.getByTestId("cart-total")).toContainText("$84.00");
        await expect(page.getByTestId("cart-item-t-shirt")).toBeVisible();
        await expect(page.getByTestId("cart-item-jeans")).toBeVisible();
        
        // Complete checkout
        await fillBraintreePayment(page);
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        await page.waitForSelector('[data-testid="order-0"]');
        await expect(page.getByTestId("order-quantity-0")).toContainText("2");
        
        // Verify both products are in the order
        await expect(page.getByTestId("order-0-product-0")).toBeVisible();
        await expect(page.getByTestId("order-0-product-1")).toBeVisible();
    });
});

test.describe("Checkout Flow - Authentication & Authorization", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test("should redirect guest user to login and then back to cart after login", async ({page}) => {
        //arrange
        await addProductToCart(page, "laptop");
        await page.goto("http://localhost:3000/cart");
        
        //act
        await page.waitForSelector('[data-testid="login-to-checkout-button"]');
        await expect(page.getByTestId("cart-message")).toContainText("please login to checkout");
        await page.getByTestId("login-to-checkout-button").click();
        
        //assert
        await expect(page).toHaveURL(/.*\/login/);
        
        // Login
        await page.getByTestId("login-email-input").fill("user@test.com");
        await page.getByTestId("login-password-input").fill("password123");
        await page.getByTestId("login-submit-button").click();
        
        // Should redirect back to cart
        await expect(page).toHaveURL(/.*\/cart/);
        await page.waitForSelector('[data-testid="cart-item-laptop"]');
        await expect(page.getByTestId("current-address")).toBeVisible();
    });

    test("should allow logged-in user without address to update profile before checkout", async ({page, testData}) => {
        //arrange
        // Create a user without address by modifying the seeded user
        const { default: User } = await import('../../models/userModel.js');
        await User.updateOne({ email: 'user@test.com' }, { $set: { address: '' } });
        
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "smartphone");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="add-address-button"]');
        await expect(page.getByTestId("no-address-section")).toBeVisible();
        
        // Click to update address
        await page.getByTestId("add-address-button").click();
        await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
        
        // Add address
        await page.getByTestId("profile-address-input").fill("123 Test Street, Test City");
        await page.getByTestId("profile-update-button").click();
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
        
        // Go back to cart
        await page.goto("http://localhost:3000/cart");
        
        //assert
        await page.waitForSelector('[data-testid="address-section"]');
        await expect(page.getByTestId("current-address")).toContainText("123 Test Street");
        await expect(page.getByTestId("payment-section")).toBeVisible();
    });
});

test.describe("Checkout Flow - Cart Management", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test("should remove items from cart and update total", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "laptop");
        await addProductToCart(page, "smartphone");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-laptop"]');
        await page.waitForSelector('[data-testid="cart-item-smartphone"]');
        await expect(page.getByTestId("cart-total")).toContainText("$1,798.00");
        
        // Remove laptop
        await page.getByTestId("remove-item-laptop").click();
        
        //assert
        await expect(page.getByTestId("cart-item-laptop")).not.toBeVisible();
        await expect(page.getByTestId("cart-item-smartphone")).toBeVisible();
        await expect(page.getByTestId("cart-total")).toContainText("$799.00");
        
        // Verify localStorage is updated
        const cartItems = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('cart') || '[]');
        });
        expect(cartItems.length).toBe(1);
        expect(cartItems[0].slug).toBe('smartphone');
    });

    test("should persist cart items across page refresh", async ({page}) => {
        //arrange
        await addProductToCart(page, "tablet");
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-tablet"]');
        
        //act
        await page.reload();
        
        //assert
        await page.waitForSelector('[data-testid="cart-item-tablet"]');
        await expect(page.getByTestId("cart-item-tablet")).toBeVisible();
        await expect(page.getByTestId("cart-total")).toContainText("$499.00");
    });

    test("should show empty cart message when cart is empty", async ({page}) => {
        //arrange
        await page.goto("http://localhost:3000/cart");
        
        //act
        await page.waitForSelector('[data-testid="cart-message"]');
        
        //assert
        await expect(page.getByTestId("cart-message")).toContainText("Your Cart Is Empty");
    });
});

test.describe("Checkout Flow - Validation & Error Scenarios", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test("should not show payment widget when cart is empty", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-message"]');
        
        //assert
        await expect(page.getByTestId("cart-message")).toContainText("Your Cart Is Empty");
        await expect(page.getByTestId("payment-section")).not.toBeVisible();
    });

    test("should not show payment widget when user is not logged in", async ({page}) => {
        //arrange
        await addProductToCart(page, "headphones");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-headphones"]');
        
        //assert
        await expect(page.getByTestId("login-to-checkout-button")).toBeVisible();
        // Payment widget should not be present
        const hasDropIn = await page.locator('.braintree-dropin').count();
        expect(hasDropIn).toBe(0);
    });

    test("should fetch and display braintree token for logged-in user", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "smartwatch");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-smartwatch"]');
        
        //assert
        // Wait for Braintree DropIn to load (indicates token was fetched)
        await page.waitForSelector('.braintree-dropin', { timeout: 10000 });
        const dropInVisible = await page.locator('.braintree-dropin').isVisible();
        expect(dropInVisible).toBe(true);
    });

    test("should disable payment button when user has no address", async ({page, testData}) => {
        //arrange
        const { default: User } = await import('../../models/userModel.js');
        await User.updateOne({ email: 'user@test.com' }, { $set: { address: '' } });
        
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "keyboard");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-keyboard"]');
        
        //assert
        await expect(page.getByTestId("no-address-section")).toBeVisible();
        // Payment button should not be visible or disabled
        const paymentButton = page.getByTestId("make-payment-button");
        const buttonCount = await paymentButton.count();
        if (buttonCount > 0) {
            await expect(paymentButton).toBeDisabled();
        }
    });

    test("should handle invalid payment card gracefully", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "mouse");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-mouse"]');
        
        // Wait for Braintree DropIn and click payment method
        await page.getByRole('button', { name: 'Paying with Card' }).click();
        
        // Fill invalid card info using same locators as fillBraintreePayment
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).click();
        await page.locator('iframe[name="braintree-hosted-field-number"]').contentFrame().getByRole('textbox', { name: 'Credit Card Number' }).fill('4000000000000002');
        
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).click();
        await page.locator('iframe[name="braintree-hosted-field-expirationDate"]').contentFrame().getByRole('textbox', { name: 'Expiration Date' }).fill('12/23');
        
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).click();
        await page.locator('iframe[name="braintree-hosted-field-cvv"]').contentFrame().getByRole('textbox', { name: 'CVV' }).fill('123');
        
        // Try to submit payment
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        
        //assert
        // Should either show an error or stay on cart page
        await expect(page.getByText('Please check your information')).toBeVisible();
    });
});

test.describe("Checkout Flow - Order Verification", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await page.evaluate(() => {
            localStorage.clear();
        });
    });

    test("should display order with correct details on orders page", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        await addProductToCart(page, "monitor");
        
        //act
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-monitor"]');
        
        await fillBraintreePayment(page);
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        
        //assert
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        await page.waitForSelector('[data-testid="order-0"]');
        
        // Verify order details
        await expect(page.getByTestId("order-status-0")).toContainText("Not Process");
        await expect(page.getByTestId("order-payment-0")).toContainText("Success");
        await expect(page.getByTestId("order-buyer-0")).toContainText("Test User");
        await expect(page.getByTestId("order-quantity-0")).toContainText("1");
        
        // Verify product in order
        await expect(page.getByTestId("order-0-product-0-name")).toContainText("Monitor");
        await expect(page.getByTestId("order-0-product-0-price")).toContainText("599");
    });

    test("should show multiple orders when user has completed multiple checkouts", async ({page}) => {
        //arrange
        await loginUser(page, "user@test.com", "password123");
        
        // First checkout
        await addProductToCart(page, "tablet");
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-tablet"]');
        await fillBraintreePayment(page);
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        
        // Second checkout
        await addProductToCart(page, "headphones");
        await page.goto("http://localhost:3000/cart");
        await page.waitForSelector('[data-testid="cart-item-headphones"]');
        await fillBraintreePayment(page);
        await page.waitForSelector('[data-testid="make-payment-button"]:not([disabled])', { timeout: 5000 });
        await page.getByTestId("make-payment-button").click();
        
        //act
        await expect(page).toHaveURL(/.*\/dashboard\/user\/orders/, { timeout: 15000 });
        
        //assert
        await page.waitForSelector('[data-testid="order-0"]');
        await page.waitForSelector('[data-testid="order-1"]');
        await expect(page.getByTestId("order-0")).toBeVisible();
        await expect(page.getByTestId("order-1")).toBeVisible();
    });
});
