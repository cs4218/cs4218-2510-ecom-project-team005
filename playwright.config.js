
    import { defineConfig } from '@playwright/test';

    export default defineConfig({
        // Global setup/teardown for MongoDB Memory Server
        globalSetup: './tests/playwright.globalSetup.js',
        globalTeardown: './tests/playwright.globalTeardown.js',

        // lokasi test UI kita
        testDir: 'tests',
        workers: 1,
        testMatch: /.*\.spec\.js/,  // only files ending with .spec.js
        use: {
            baseURL: 'http://localhost:3000',  // React app
            trace: 'on-first-retry',            // rekam jejak saat test gagal
            screenshot: 'only-on-failure',
            video: 'retain-on-failure'
        },
        reporter: [
            ['html', { outputFolder: 'playwright-report', open: 'never' }],
            ['list'] // This will show more output in terminal
        ],
        // Auto start server when running tests
        webServer: {
            command: 'cross-env NODE_ENV=test npm run dev',
            url: 'http://localhost:3000',
            reuseExistingServer: true,
            timeout: 120000,
            stdout: 'pipe',  // Show server stdout in terminal
            stderr: 'pipe'   // Show server stderr in terminal
        }
    });
