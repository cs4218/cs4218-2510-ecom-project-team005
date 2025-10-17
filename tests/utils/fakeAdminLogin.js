import { test } from '@playwright/test';

export async function fakeAdminLogin(page) {
    // Go to any page on the same origin first
    await page.goto('http://localhost:3000');

    // Inject admin credentials into localStorage
    await page.evaluate(() => {
        localStorage.setItem('auth', JSON.stringify({
            success: true,
            message: 'Login successful',
            token: 'fake-admin-token',
            user: {
                name: 'admin@test.sg',
                email: 'admin@test.sg',
                phone: 'admin@test.sg',
                address: 'admin@test.sg',
                answer: 'admin@test.sg',
                role: 1, // admin
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        }));
    });
};
