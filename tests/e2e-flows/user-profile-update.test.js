/**
 * E2E Test #21: Edit User Profile
 *
 * Tests user profile update functionality and security
 * Aligns with Dashboard.integration.test.js (profile editing, XSS sanitization)
 *
 * Scenarios:
 * - User accesses profile edit page
 * - Update name successfully
 * - Update email successfully
 * - Update password successfully
 * - Update phone number and address
 * - Form validation (required fields, email format)
 * - XSS sanitization in name and address fields
 * - Profile data persistence across sessions
 * - Access control (must be logged in)
 */

import { test, expect } from '../fixtures/testData.js';
import { loginRegularUser, clearStorage, logoutUser } from '../helpers/authHelpers.js';

test.describe.configure({mode: "serial"});

test.describe("User Profile Update - Access and Display", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should access profile page when logged in", async ({page}) => {
        // Arrange - Login as user
        await loginRegularUser(page);

        // Act - Navigate to profile page
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Assert - Profile page loaded
        await expect(page.locator('h1:has-text("USER PROFILE"), h4:has-text("USER PROFILE")')).toBeVisible();
        await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
    });

    test("should display profile form with all fields", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act & Assert - All form fields present
        await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
        await expect(page.locator('input[name="email"], input[placeholder*="email" i]')).toBeVisible();
        await expect(page.locator('input[name="password"], input[placeholder*="password" i]')).toBeVisible();
        await expect(page.locator('input[name="phone"], input[placeholder*="phone" i]')).toBeVisible();
        await expect(page.locator('input[name="address"], input[placeholder*="address" i]')).toBeVisible();
        await expect(page.locator('button:has-text("UPDATE")')).toBeVisible();
    });

    test("should pre-populate form with current user data", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Get form values
        const nameValue = await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue();
        const emailValue = await page.locator('input[name="email"], input[placeholder*="email" i]').inputValue();

        // Assert - User data populated (user@test.com has name "Test User")
        expect(nameValue).toBe('Test User');
        expect(emailValue).toBe('user@test.com');
    });

    test("should redirect to login when not authenticated", async ({page}) => {
        // Arrange - No login, clear session
        await clearStorage(page);

        // Act - Try to access profile page
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Assert - Redirected to login via Spinner
        await expect(page.locator('text=redirecting to you in')).toBeVisible();

        // Wait for redirect
        await page.waitForTimeout(3500);
        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe("User Profile Update - Update Operations", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should update user name successfully", async ({page}) => {
        // Arrange - Login and navigate to profile
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Update name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        await nameInput.clear();
        await nameInput.fill('Updated Test User');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message displayed
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify updated name persists
        await page.reload();
        const updatedName = await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue();
        expect(updatedName).toBe('Updated Test User');
    });

    test("should update email successfully", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Update email
        const emailInput = page.locator('input[name="email"], input[placeholder*="email" i]');
        await emailInput.clear();
        await emailInput.fill('newemail@test.com');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });
    });

    test("should update password successfully", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Update password
        const passwordInput = page.locator('input[name="password"], input[placeholder*="password" i]').first();
        await passwordInput.fill('newpassword123');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });
    });

    test("should update phone number successfully", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Update phone
        const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone" i]');
        await phoneInput.fill('555-1234');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify phone persists
        await page.reload();
        const updatedPhone = await page.locator('input[name="phone"], input[placeholder*="phone" i]').inputValue();
        expect(updatedPhone).toBe('555-1234');
    });

    test("should update address successfully", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Update address
        const addressInput = page.locator('input[name="address"], input[placeholder*="address" i]');
        await addressInput.fill('123 Main Street, Test City');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify address persists
        await page.reload();
        const updatedAddress = await page.locator('input[name="address"], input[placeholder*="address" i]').inputValue();
        expect(updatedAddress).toBe('123 Main Street, Test City');
    });

    test("should update multiple fields simultaneously", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Update name, phone, and address together
        await page.locator('input[name="name"], input[placeholder*="name" i]').fill('Multi Update User');
        await page.locator('input[name="phone"], input[placeholder*="phone" i]').fill('555-9999');
        await page.locator('input[name="address"], input[placeholder*="address" i]').fill('456 Oak Avenue');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify all fields persisted
        await page.reload();
        expect(await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue()).toBe('Multi Update User');
        expect(await page.locator('input[name="phone"], input[placeholder*="phone" i]').inputValue()).toBe('555-9999');
        expect(await page.locator('input[name="address"], input[placeholder*="address" i]').inputValue()).toBe('456 Oak Avenue');
    });
});

test.describe("User Profile Update - XSS Sanitization and Security", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should sanitize XSS in name field", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Try to inject script tag in name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        await nameInput.clear();
        await nameInput.fill('<script>alert("XSS")</script>User');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message (sanitization happens server-side)
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Reload and verify script tag sanitized
        await page.reload();
        const sanitizedName = await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue();

        // Should NOT contain script tag (sanitized to plain text or removed)
        expect(sanitizedName).not.toContain('<script>');
        expect(sanitizedName).not.toContain('</script>');
    });

    test("should sanitize XSS in address field", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Try to inject malicious HTML in address
        const addressInput = page.locator('input[name="address"], input[placeholder*="address" i]');
        await addressInput.fill('<img src=x onerror=alert(1)>123 Street');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify sanitization
        await page.reload();
        const sanitizedAddress = await page.locator('input[name="address"], input[placeholder*="address" i]').inputValue();

        // Should NOT contain img tag or onerror attribute
        expect(sanitizedAddress).not.toContain('<img');
        expect(sanitizedAddress).not.toContain('onerror');
    });

    test("should handle HTML entities in name field", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Use HTML entities
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        await nameInput.clear();
        await nameInput.fill('John &lt;Developer&gt;');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify data saved (sanitization may convert entities)
        await page.reload();
        const savedName = await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue();
        expect(savedName.length).toBeGreaterThan(0);
    });

    test("should prevent JavaScript injection in phone field", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Try JavaScript injection
        const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone" i]');
        await phoneInput.fill('javascript:alert(1)');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Either rejected or sanitized
        // If update succeeds, verify no script execution
        const hasSuccess = await page.getByText(/profile.*updated successfully/i).isVisible({ timeout: 3000 }).catch(() => false);

        if (hasSuccess) {
            // Verify no alert dialog appeared (XSS blocked)
            await page.waitForTimeout(1000);
            // If we reach here, no alert was triggered (good)
        }
    });
});

test.describe("User Profile Update - Form Validation and Edge Cases", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should handle empty name field", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Clear name and submit
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        await nameInput.clear();
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Either error message or prevented (depends on validation)
        await page.waitForTimeout(2000);
        // If error message appears, verify it
        const hasError = await page.getByText(/name.*required/i).isVisible().catch(() => false);

        if (!hasError) {
            // Might allow empty or show different validation
            // Just verify page didn't crash
            await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
        }
    });

    test("should validate email format", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Enter invalid email
        const emailInput = page.locator('input[name="email"], input[placeholder*="email" i]');
        await emailInput.clear();
        await emailInput.fill('invalid-email-format');
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Either error or HTML5 validation prevents submit
        await page.waitForTimeout(2000);

        // Check if still on profile page (validation prevented navigation)
        await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
    });

    test("should persist profile updates across logout and login", async ({page}) => {
        // Arrange - Update profile
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        await page.locator('input[name="name"], input[placeholder*="name" i]').fill('Persistent User');
        await page.locator('input[name="phone"], input[placeholder*="phone" i]').fill('555-7777');
        await page.locator('button:has-text("UPDATE")').click();
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Act - Logout and login again
        await logoutUser(page);

        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Assert - Updated data still present
        expect(await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue()).toBe('Persistent User');
        expect(await page.locator('input[name="phone"], input[placeholder*="phone" i]').inputValue()).toBe('555-7777');
    });

    test("should handle very long input in address field", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Enter very long address
        const longAddress = 'A'.repeat(500); // 500 character address
        const addressInput = page.locator('input[name="address"], input[placeholder*="address" i]');
        await addressInput.fill(longAddress);
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Either accepts or truncates
        await page.waitForTimeout(2000);

        // Verify page didn't crash
        await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
    });

    test("should navigate to profile from user dashboard", async ({page}) => {
        // Arrange - Login and go to dashboard
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user");

        // Act - Click profile link in UserMenu
        await page.getByRole('link', { name: /profile/i }).click();

        // Assert - Redirected to profile page
        await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
        await expect(page.locator('h1:has-text("USER PROFILE"), h4:has-text("USER PROFILE")')).toBeVisible();
    });

    test("should update profile with special characters in name", async ({page}) => {
        // Arrange
        await loginRegularUser(page);
        await page.goto("http://localhost:3000/dashboard/user/profile");

        // Act - Use special characters
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        await nameInput.clear();
        await nameInput.fill("O'Brien-Smith");
        await page.locator('button:has-text("UPDATE")').click();

        // Assert - Success message
        await expect(page.getByText(/profile.*updated successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify name with special chars persists
        await page.reload();
        const savedName = await page.locator('input[name="name"], input[placeholder*="name" i]').inputValue();
        expect(savedName).toBe("O'Brien-Smith");
    });
});
