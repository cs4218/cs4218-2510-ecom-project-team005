import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { seedAll } from '../helpers/testDataSeeder.js';
import User from '../../models/userModel.js';
import Order from '../../models/orderModel.js';

function pickEnum(enumArr, preferred = []) {
  if (!Array.isArray(enumArr) || enumArr.length === 0) return null;
  const lower = enumArr.map(e => String(e).toLowerCase());
  for (const c of preferred) {
    const i = lower.indexOf(String(c).toLowerCase());
    if (i >= 0) return enumArr[i];
  }
  return enumArr[0];
}

describe('PUT /api/v1/auth/order-status/:orderId (admin)', () => {
  let token, orderId, nextStatus;

  beforeAll(async () => {
    await seedAll();
    const admin = await User.findOne({ role: 1 }) || await User.findOne({ email: 'admin@admin.com' });
    const SECRET = process.env.JWT_SECRET || 'HGFHGEAD12124322432';
    token = jwt.sign({ _id: String(admin._id), name: admin.name, email: admin.email, role: 1 }, SECRET, { expiresIn: '1h' });

    const anyOrder = await Order.findOne();
    orderId = anyOrder._id;
    const statusEnum = Order.schema.path('status')?.options?.enum || [];
    nextStatus = pickEnum(statusEnum, ['delivered','shipped','completed','fulfilled']) || statusEnum[0];
  });

  test('admin bisa update status order', async () => {
    const res = await request(app)
      .put(`/api/v1/auth/order-status/${orderId}`)
      .set('authorization', token)
      .send({ status: nextStatus });

    expect([200,201]).toContain(res.status);
    const updated = await Order.findById(orderId);
    expect(String(updated.status).toLowerCase()).toBe(String(nextStatus).toLowerCase());
  });
});
