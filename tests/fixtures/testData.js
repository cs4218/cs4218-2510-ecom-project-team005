import { test as base } from '@playwright/test';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import * as seeder from '../helpers/testDataSeeder.js';

/**
 * Custom Playwright fixture providing test data management
 * Usage: test('my test', async ({ page, testData }) => { ... });
 */
export const test = base.extend({
  testData: async ({}, use) => {
    if (mongoose.connection.readyState === 0) {
      const uriFile = path.join(process.cwd(), '.playwright-temp', 'mongo-uri.txt');
      const mongoUrl = fs.readFileSync(uriFile, 'utf8').trim();
      await mongoose.connect(mongoUrl);
    }

    await use({
      reset: () => seeder.seedAll(),
      clearDatabase: () => seeder.clearDatabase(),
      seedCategories: () => seeder.seedCategories(),
      seedProducts: (categories) => seeder.seedProducts(categories),
      seedUsers: () => seeder.seedUsers(),
      seedAll: () => seeder.seedAll()
    });
  }
});

export { expect } from '@playwright/test';

