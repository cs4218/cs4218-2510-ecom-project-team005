// tests/integration/orders.my.int.test.js
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js'; // atau '../../src/app.js'
import { seedAll } from '../helpers/testDataSeeder.js';
import User from '../../models/userModel.js';
import Order from '../../models/orderModel.js';
import Product from '../../models/productModel.js';

function extractOrders(body) {
  // dukung root array atau object
  if (Array.isArray(body)) return body;
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

    const user =
      (await User.findOne({ email: 'cs4218@test.com' })) ||
      (await User.findOne({ role: 0 }));
    if (!user) throw new Error('User test tidak ditemukan');

    // pastikan ada MINIMAL 1 order untuk user ini, gunakan key buyer/user sesuai schema
    const anyProduct = (await Product.findOne()) || await Product.create({
      name: 'Temp P', slug: 'temp-p', description: 'temp', price: 1, category: (await (await import('../../models/categoryModel.js')).default.findOne())._id, quantity: 1, shipping: true
    });

    const statusEnum = Order.schema.path('status')?.options?.enum || [];
    const status = statusEnum[0] || 'created';

    const hasBuyer = Boolean(Order.schema.path('buyer'));
    const filter = hasBuyer ? { buyer: user._id } : { user: user._id };
    const existing = await Order.findOne(filter);

    if (!existing) {
      await Order.create({
        ...(hasBuyer ? { buyer: user._id } : { user: user._id }),
        items: [{ product: anyProduct._id, quantity: 1 }],
        ...(status ? { status } : {}),
        payment: { success: true, transactionId: 'seed1' }
      });
    }

    const SECRET = process.env.JWT_SECRET || 'HGFHGEAD12124322432';
    token = jwt.sign(
      { _id: String(user._id), name: user.name, email: user.email, role: user.role ?? 0 },
      SECRET,
      { expiresIn: '1h' }
    );
  });

  test('mengembalikan orders milik user login', async () => {
    const res = await request(app)
      .get('/api/v1/auth/orders')
      .set('authorization', token); // token murni, tanpa "Bearer "

    expect([200, 201]).toContain(res.status);

    const orders = extractOrders(res.body);
    expect(Array.isArray(orders)).toBe(true);
    expect(orders.length).toBeGreaterThan(0);
  });
});
