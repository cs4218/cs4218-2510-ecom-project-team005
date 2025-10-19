// tests/integration/db.int.test.js
import mongoose from 'mongoose';
import { seedAll } from '../helpers/testDataSeeder';

test('DB connect & seedAll OK', async () => {
  expect(mongoose.connection.readyState).toBe(1); // connected
  const { users, products } = await seedAll();
  expect(users.length).toBeGreaterThan(0);
  expect(products.length).toBeGreaterThan(0);
});
