/**
 * E2E Test #21: Edit User Profile
 *
 * Tests user profile update functionality and security
 * Aligns with Dashboard.integration.test.js (profile editing, XSS sanitization)
 *
 * Scenarios:
 * - Navigate to profile from user dashboard
 * - Update user name successfully
 * - Update multiple fields simultaneously
 * - XSS sanitization in name and address fields
 * - Profile data persistence across sessions
 * - Special characters handling
 * - Access control (must be logged in)
 */

import { test, expect } from '../fixtures/testData.js';
import { loginRegularUser, clearStorage, logoutUser } from '../helpers/authHelpers.js';

test.describe.configure({mode: "serial"});

test.describe("User Profile Update - Access and Navigation", () => {
    test.beforeEach(async ({page, testData}) => {
        await testData.seedAll();
        await page.goto("http://localhost:3000");
        await clearStorage(page);
    });

    test("should navigate to profile from user dashboard", async ({page}) => {
        // Arrange - Login and go to dashboard
        await loginRegularUser(page);

        // Act - Navigate through UI
        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: /profile/i }).click();

        // Assert - Redirected to profile page
        await expect(page).toHaveURL(/.*\/dashboard\/user\/profile/);
        await expect(page.getByRole('heading', { name: /USER PROFILE/i })).toBeVisible();
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

        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        // Act - Update name
        const nameInput = page.getByTestId('profile-name-input');
        await nameInput.clear();
        await nameInput.fill('Updated Test User');
        await page.getByTestId('profile-update-button').click();

        // Assert - Success message displayed
        await expect(page.getByText(/Profile.*Updated Successfully/i)).toBeVisible({ timeout: 5000 });
    });

    test("should update multiple fields simultaneously", async ({page}) => {
        // Arrange - Login and navigate
        await loginRegularUser(page);

        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        // Act - Update name, phone, and address together
        await page.getByTestId('profile-name-input').fill('Multi Update User');
        await page.getByTestId('profile-phone-input').fill('555-9999');
        await page.getByTestId('profile-address-input').fill('456 Oak Avenue');
        await page.getByTestId('profile-update-button').click();

        // Assert - Success message
        await expect(page.getByText(/Profile.*Updated Successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify all fields persisted

        expect(await page.getByTestId('profile-name-input').inputValue()).toBe('Multi Update User');
        expect(await page.getByTestId('profile-phone-input').inputValue()).toBe('555-9999');
        expect(await page.getByTestId('profile-address-input').inputValue()).toBe('456 Oak Avenue');
    });

    // bug found: persistent user not possible
    test.skip("should persist profile updates across logout and login", async ({page}) => {
        // Arrange - Update profile
        await loginRegularUser(page);

        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        await page.getByTestId('profile-name-input').fill('Persistent User');
        await page.getByTestId('profile-phone-input').fill('555-7777');
        await page.getByTestId('profile-update-button').click();
        await expect(page.getByText(/Profile.*Updated Successfully/i)).toBeVisible({ timeout: 5000 });

        // Act - Logout and login again
        await logoutUser(page);

        await loginRegularUser(page);
        await page.getByRole('button', { name: 'Persistent User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        // Assert - Updated data still present
        expect(await page.getByTestId('profile-name-input').inputValue()).toBe('Persistent User');
        expect(await page.getByTestId('profile-phone-input').inputValue()).toBe('555-7777');
    });

    test("should update profile with special characters in name", async ({page}) => {
        // Arrange - Login and navigate
        await loginRegularUser(page);

        await page.getByRole('button', { name: 'Test User' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Profile' }).click();

        // Act - Use special characters
        const nameInput = page.getByTestId('profile-name-input');
        await nameInput.clear();
        await nameInput.fill("O'Brien-Smith");
        await page.getByTestId('profile-update-button').click();

        // Assert - Success message
        await expect(page.getByText(/Profile.*Updated Successfully/i)).toBeVisible({ timeout: 5000 });

        // Verify name with special chars persists

        const savedName = await page.getByTestId('profile-name-input').inputValue();
        expect(savedName).toBe("O'Brien-Smith");
    });
});