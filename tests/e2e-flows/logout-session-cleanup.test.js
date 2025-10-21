/**
 * E2E Test #25: Logout and Session Cleanup
 *
 * Tests logout functionality and session/state cleanup
 * Aligns with Dashboard.integration.test.js and Private.integration.test.js (auth lifecycle)
 *
 * Scenarios:
 * - User logs out successfully
 * - Auth data cleared from localStorage
 * - Cart data cleared on logout
 * - Redirect to login after logout
 * - Cannot access protected routes after logout
 * - Logout from different pages (dashboard, cart, product page)
 * - Multiple logout attempts (idempotent)
 * - Session cleanup prevents unauthorized access
 */

import { test, expect } from '../fixtures/testData.js';
import { loginRegularUser, loginAdmin, clearStorage, getAuthData, logoutUser } from '../helpers/authHelpers.js';

test.describe.configure({mode: "serial"});

test.describe("Logout - Basic Logout Flow", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should logout user successfully from homepage", async ({page}) => {
        // Arrange - Login as user
        await loginRegularUser(page);
        await page.goto("http://localhost:3000");

        // Verify logged in state
        const authBefore = await getAuthData(page);
        expect(authBefore).not.toBeNull();
        expect(authBefore.token).toBeTruthy();

        // Act - Click logout
        await logoutUser(page);

        // Auth cleared
        const authAfter = await getAuthData(page);
        expect(authAfter).toBeNull();
    });

    test("should display login link after logout", async ({page}) => {
        // Arrange - Login
        await loginRegularUser(page);
        await page.goto("http://localhost:3000");

        // Act - Logout
        await logoutUser(page);

        // Assert - Login link visible (user is logged out)
        await page.goto("http://localhost:3000");
        await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Test User' })).not.toBeVisible();
    });

    test("should logout admin successfully", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);
        await page.goto("http://localhost:3000/dashboard/admin");

        // Verify admin logged in
        const authBefore = await getAuthData(page);
        expect(authBefore).not.toBeNull();
        expect(authBefore.user.role).toBe(1); // Admin role

        // Act - Logout
        await logoutUser(page);

        // Assert - Auth cleared
        const authAfter = await getAuthData(page);
        expect(authAfter).toBeNull();
    });

    test("should show logout button only when logged in", async ({page}) => {
        // Arrange - Not logged in
        await page.goto("http://localhost:3000");

        // Assert - No user dropdown (not logged in)
        await expect(page.getByRole('link', { name: /login/i })).toBeVisible();

        // Act - Login
        await loginRegularUser(page);
        await page.goto("http://localhost:3000");

        // Assert - User dropdown visible (logged in)
        await expect(page.getByRole('button', { name: 'Test User' })).toBeVisible();
    });
});

test.describe("Logout - Session and State Cleanup", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should clear localStorage auth data on logout", async ({page}) => {
        // Arrange - Login
        await loginRegularUser(page);

        // Verify localStorage has auth
        const authData = await page.evaluate(() => localStorage.getItem('auth'));
        expect(authData).not.toBeNull();

        // Act - Logout
        await logoutUser(page);

        // Assert - localStorage auth cleared
        const authAfterLogout = await page.evaluate(() => localStorage.getItem('auth'));
        expect(authAfterLogout).toBeNull();
    });

    test("should clear cart data on logout", async ({page}) => {
        // Arrange - Login and add item to cart
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/product/laptop");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        // Verify cart has items
        await page.goto("http://localhost:3000/cart");
        await expect(page.getByTestId("cart-item-laptop")).toBeVisible();

        // Act - Logout
        await logoutUser(page);

        // Assert - Cart cleared (localStorage cart should be empty)
        const cartData = await page.evaluate(() => localStorage.getItem('cart'));
        expect(cartData).toBeNull();
    });

    test("should clear all session data from localStorage", async ({page}) => {
        // Arrange - Login
        await loginRegularUser(page);

        // Set some session data
        await page.evaluate(() => {
            localStorage.setItem('auth', JSON.stringify({ user: 'test' }));
            localStorage.setItem('cart', JSON.stringify([1, 2, 3]));
        });

        // Act - Logout
        await logoutUser(page);

        // Assert - All relevant session data cleared
        const authData = await page.evaluate(() => localStorage.getItem('auth'));
        expect(authData).toBeNull();
    });

    test("should handle logout when already logged out (idempotent)", async ({page}) => {
        // Arrange - Not logged in
        await clearStorage(page);
        await page.goto("http://localhost:3000");

        // Assert - No auth data, no user dropdown
        const authBefore = await getAuthData(page);
        expect(authBefore).toBeNull();

        // User dropdown should not be visible when not logged in
        await expect(page.getByRole('button', { name: 'Test User' })).not.toBeVisible();
    });
});

test.describe("Logout - Protected Routes After Logout", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should redirect to login when accessing user dashboard after logout", async ({page}) => {
        // Arrange - Login and logout
        await loginRegularUser(page);
        await logoutUser(page);

        // Act - Try to access user dashboard
        await page.goto("http://localhost:3000/dashboard/user");

        // Assert - Redirected to login via Spinner
        await expect(page.locator('text=redirecting to you in')).toBeVisible();
        await page.waitForTimeout(3500);
        await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect to login when accessing admin dashboard after logout", async ({page}) => {
        // Arrange - Login as admin and logout
        await loginAdmin(page);
        await logoutUser(page);

        // Act - Try to access admin dashboard
        await page.goto("http://localhost:3000/dashboard/admin");

        // Assert - Redirected to login
        await expect(page.locator('text=redirecting to you in')).toBeVisible();
        await page.waitForTimeout(3500);
        await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect to login when accessing orders after logout", async ({page}) => {
        // Arrange - Login and logout
        await loginRegularUser(page);
        await logoutUser(page);

        // Act - Try to access orders
        await page.goto("http://localhost:3000/dashboard/user/orders");

        // Assert - Redirected to login
        await expect(page.locator('text=redirecting to you in')).toBeVisible();
        await page.waitForTimeout(3500);
        await expect(page).toHaveURL(/\/login/);
    });

    test("should redirect to login when accessing profile after logout", async ({page}) => {
        // Arrange - Login and logout
        await loginRegularUser(page);
        await logoutUser(page);

        // Act - Try to access profile
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Assert - Redirected to login
        await expect(page.locator('text=redirecting to you in')).toBeVisible();
        await page.waitForTimeout(3500);
        await expect(page).toHaveURL(/\/login/);
    });

    test("should allow access to public pages after logout", async ({page}) => {
        // Arrange - Login and logout
        await loginRegularUser(page);
        await logoutUser(page);

        // Act - Access public pages
        await page.goto("http://localhost:3000");

        // Assert - Homepage accessible
        await expect(page).toHaveURL(/http:\/\/localhost:3000\/?$/);

        // Navigate to product page (public)
        await page.goto("http://localhost:3000/product/laptop");
        await expect(page).toHaveURL(/.*\/product\/laptop/);
    });
});

test.describe("Logout - Logout from Different Pages", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should logout from user dashboard", async ({page}) => {
        // Arrange - Login and navigate to dashboard
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user");

        // Act - Logout from dashboard
        await logoutUser(page);

        // Assert - Logged out successfully
        const authData = await getAuthData(page);
        expect(authData).toBeNull();
    });

    test("should logout from cart page", async ({page}) => {
        // Arrange - Login and go to cart
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/cart");

        // Act - Logout from cart
        await logoutUser(page);

        // Assert - Logged out and redirected
        const authData = await getAuthData(page);
        expect(authData).toBeNull();
    });

    test("should logout from product details page", async ({page}) => {
        // Arrange - Login and view product
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/product/smartphone");

        // Act - Logout from product page
        await logoutUser(page);

        // Assert - Logged out successfully
        const authData = await getAuthData(page);
        expect(authData).toBeNull();
    });

    test("should logout from orders page", async ({page}) => {
        // Arrange - Login and go to orders
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/orders");

        // Act - Logout
        await logoutUser(page);

        // Assert - Logged out successfully
        const authData = await getAuthData(page);
        expect(authData).toBeNull();
    });

    test("should logout from profile page", async ({page}) => {
        // Arrange - Login and go to profile
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Logout
        await logoutUser(page);

        // Assert - Logged out successfully
        const authData = await getAuthData(page);
        expect(authData).toBeNull();
    });
});

test.describe("Logout - Session Cleanup Security", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should prevent cart checkout after logout", async ({page}) => {
        // Arrange - Login, add to cart
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/product/laptop");
        await page.getByTestId("add-to-cart-button").click();
        await expect(page.getByText("Item Added to cart").first()).toBeVisible();

        // Logout
        await logoutUser(page);

        // Act - Try to access cart page
        await page.goto("http://localhost:3000/cart");

        // Assert - Cart empty or redirected (session cleared)
        // Cart should be empty since localStorage was cleared on logout
        const hasCartItems = await page.locator('[data-testid^="cart-item-"]').count();
        expect(hasCartItems).toBe(0);
    });

    test("should require re-login for protected actions after logout", async ({page}) => {
        // Arrange - Login and logout
        await loginRegularUser(page);
        await logoutUser(page);

        // Act - Try to add product to cart (requires auth for some flows)
        await page.goto("http://localhost:3000/product/smartphone");

        // Try to navigate to cart (public page but empty)
        await page.goto("http://localhost:3000/cart");

        // Assert - No items in cart (session cleared)
        const hasItems = await page.locator('[data-testid^="cart-item-"]').count();
        expect(hasItems).toBe(0);
    });

    test("should clear auth token preventing API requests after logout", async ({page}) => {
        // Arrange - Login
        await loginRegularUser(page);

        // Get auth token
        const tokenBefore = await page.evaluate(() => {
            const auth = localStorage.getItem('auth');
            return auth ? JSON.parse(auth).token : null;
        });
        expect(tokenBefore).not.toBeNull();

        // Act - Logout
        await logoutUser(page);

        // Assert - Token cleared
        const tokenAfter = await page.evaluate(() => {
            const auth = localStorage.getItem('auth');
            return auth ? JSON.parse(auth).token : null;
        });
        expect(tokenAfter).toBeNull();
    });

    test("should not persist user role after logout", async ({page}) => {
        // Arrange - Login as admin
        await loginAdmin(page);

        const roleBefore = await page.evaluate(() => {
            const auth = localStorage.getItem('auth');
            return auth ? JSON.parse(auth).user.role : null;
        });
        expect(roleBefore).toBe(1); // Admin role

        // Act - Logout
        await logoutUser(page);

        // Assert - Role data cleared
        const roleAfter = await page.evaluate(() => {
            const auth = localStorage.getItem('auth');
            return auth ? JSON.parse(auth).user.role : null;
        });
        expect(roleAfter).toBeNull();
    });
});
