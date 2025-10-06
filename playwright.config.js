// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // lokasi test UI kita
  testDir: 'tests/ui',
  use: {
    baseURL: 'http://localhost:3000',  // React app
    trace: 'on-first-retry',            // rekam jejak saat test gagal
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  // Opsi lanjut (nanti kalau mau auto start server):
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120000
  // }
});
