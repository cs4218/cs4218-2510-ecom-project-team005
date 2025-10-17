// tests/ui/login.spec.js
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {

    // Navigate to login page before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/login');
    });

    test('should render the login form correctly', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Your Email' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Enter Your Password' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'LOGIN' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Forgot Password' })).toBeVisible();
    });

    test('should allow typing into email and password fields', async ({ page }) => {
        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });

        await emailInput.fill('test@email.com');
        await passwordInput.fill('test1234');

        await expect(emailInput).toHaveValue('test@email.com');
        await expect(passwordInput).toHaveValue('test1234');
    });

    test('should show validation errors when fields are empty', async ({ page }) => {
        await page.getByRole('button', { name: 'LOGIN' }).click();
        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should validate email format before submission', async ({ page }) => {
        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });

        await emailInput.fill('invalid-email');
        await passwordInput.fill('password123');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        // Check that we are still on login page
        await expect(page).toHaveURL(/login$/);
    });

    test('should navigate to forgot password page', async ({ page }) => {
        await page.getByRole('button', { name: 'Forgot Password' }).click();
        await expect(page).toHaveURL(/forgot-password/);
    });

    test('should login successfully and redirect (mocked)', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                json: {
                    success: true,
                    message: 'Login successful',
                    user: { name: 'John Doe', email: 'test@email.com' },
                    token: 'mocktoken123'
                }
            });
        });

        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });

        await emailInput.fill('test@email.com');
        await passwordInput.fill('test1234');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page).toHaveURL('http://localhost:3000/');

        // Check localStorage
        const authData = await page.evaluate(() => localStorage.getItem('auth'));
        expect(authData).toContain('mocktoken123');
    });

    test('should show error toast on failed login (mocked)', async ({ page }) => {
        await page.route('**/api/v1/auth/login', async route => {
            await route.fulfill({
                json: { success: false, message: 'Invalid credentials' }
            });
        });

        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });

        await emailInput.fill('wrong@email.com');
        await passwordInput.fill('wrongpass');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });

    test('should not allow login with empty email but filled password', async ({ page }) => {
        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });
        await passwordInput.fill('mypassword');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        await expect(emailInput).toHaveAttribute('required', '');
    });

    test('should not allow login with empty password but filled email', async ({ page }) => {
        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        await emailInput.fill('test@email.com');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });
        await expect(passwordInput).toHaveAttribute('required', '');
    });

    test('should show generic error toast when network request fails', async ({ page }) => {
        await page.route('**/api/v1/auth/login', route => route.abort('failed'));
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user@test.com');
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password');
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await expect(page.getByText('Something went wrong')).toBeVisible();
    });


    test('password input should be masked', async ({ page }) => {
        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });


/*
    test('should show multiple error messages for invalid email and empty password', async ({ page }) => {
        const emailInput = page.getByRole('textbox', { name: 'Enter Your Email' });
        await emailInput.fill('invalid-email');
        await page.getByRole('button', { name: 'LOGIN' }).click();

        const passwordInput = page.getByRole('textbox', { name: 'Enter Your Password' });
        await expect(passwordInput).toHaveAttribute('required', '');
        await expect(page.getByText(/invalid email/i)).toBeVisible();
    });*/

});
