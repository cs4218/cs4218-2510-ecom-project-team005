/**
 * Authentication Helper Functions for E2E Tests
 *
 * Provides reusable login/logout functions for Playwright E2E tests
 * Uses data-testid attributes for reliable element selection
 */

/**
 * Login user with email and password
 * @param {Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
export async function loginUser(page, email, password) {
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

/**
 * Login admin user with preset credentials
 * @param {Page} page - Playwright page object
 */
export async function loginAdmin(page) {
    await loginUser(page, "admin@test.com", "password123");
}

/**
 * Login regular user with preset credentials
 * @param {Page} page - Playwright page object
 */
export async function loginRegularUser(page) {
    await loginUser(page, "user@test.com", "password123");
}

/**
 * Logout current user
 * @param {Page} page - Playwright page object
 */
export async function logoutUser(page) {
    // Get the user's name from auth to click the dropdown
    const userName = await page.evaluate(() => {
        const auth = localStorage.getItem('auth');
        return auth ? JSON.parse(auth).user.name : null;
    });

    if (userName) {
        // Remove webpack overlay if it exists, which can block clicks
        await page.evaluate(() => {
            const overlay = document.getElementById('webpack-dev-server-client-overlay');
            if (overlay) {
                overlay.remove();
            }
        });

        // Click the user dropdown button to reveal logout link
        await page.getByRole('button', { name: userName }).click();

        // Click logout link in the dropdown menu
        await page.getByRole('link', { name: 'Logout' }).click();

        // Wait for redirect to complete by checking for the login page or homepage URL
        await page.waitForURL((url) => url.pathname === '/login' || url.pathname === '/', { timeout: 5000 });
    }

    // Verify auth cleared from localStorage
    await page.waitForFunction(() => {
        const auth = localStorage.getItem('auth');
        return auth === null || auth === 'undefined' || auth === '';
    }, { timeout: 5000 });
}

/**
 * Clear all localStorage data
 * @param {Page} page - Playwright page object
 */
export async function clearStorage(page) {
    await page.evaluate(() => localStorage.clear());
}

/**
 * Get current auth data from localStorage
 * @param {Page} page - Playwright page object
 * @returns {Object|null} Auth data object or null
 */
export async function getAuthData(page) {
    return await page.evaluate(() => {
        const auth = localStorage.getItem('auth');
        return auth ? JSON.parse(auth) : null;
    });
}

/**
 * Check if user is currently logged in
 * @param {Page} page - Playwright page object
 * @returns {boolean} True if logged in, false otherwise
 */
export async function isLoggedIn(page) {
    const authData = await getAuthData(page);
    return authData !== null && authData.token !== '';
}
