import request from 'supertest';
import app from '../../app.js';
import '../setup/db.setup.js';
import { signTestUser } from '../helpers/authToken.js';
import Order from '../../models/orderModel.js';

test('200: admin can list all orders', async () => {
  const admin = signTestUser({ role: 1 });
  await Order.create([{ user: '507f...', items: [], status: 'Not Process', amount: 1 }]);

  const res = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${admin}`);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body?.orders)).toBe(true);
});
