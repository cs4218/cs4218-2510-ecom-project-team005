import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js'; // ganti ke '../../src/app.js' kalau app.js di /src
import { seedAll } from '../helpers/testDataSeeder.js';
import User from '../../models/userModel.js';

function extractOrders(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.orders)) return body.orders;
  if (Array.isArray(body.data)) return body.data;
  if (body.data && Array.isArray(body.data.orders)) return body.data.orders;
  const k = Object.keys(body).find(key => Array.isArray(body[key]));
  return k ? body[k] : [];
}

describe('GET /api/v1/auth/orders (user)', () => {
  let token;

  beforeAll(async () => {
    await seedAll();
    const user = await User.findOne({ email: 'cs4218@test.com' }) || await User.findOne({ role: 0 });
    const SECRET = process.env.JWT_SECRET || 'HGFHGEAD12124322432';
    token = jwt.sign({ _id: String(user._id), name: user.name, email: user.email, role: user.role ?? 0 }, SECRET, { expiresIn: '1h' });
  });

  test('mengembalikan orders milik user login', async () => {
    const res = await request(app).get('/api/v1/auth/orders').set('authorization', token);
    expect([200,201]).toContain(res.status);
    const orders = extractOrders(res.body);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
  });
});
