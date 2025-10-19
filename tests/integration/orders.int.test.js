import request from 'supertest';
import app from '../../app.js';
import '../setup/db.setup.js';
import { signTestUser } from '../helpers/authToken.js';
import Order from '../../models/orderModel.js'; // sesuaikan path

describe('Orders integration', () => {
  test('200: get user orders (joins model correctly)', async () => {
    const userToken = signTestUser();
    const userId = '507f1f77bcf86cd799439011';

    // seed 1 order untuk user
    await Order.create({
      user: userId,
      items: [{ product: '507f1f77bcf86cd799439012', qty: 1, price: 10 }],
      status: 'Not Process',
      amount: 10
    });

    const res = await request(app)
      .get('/api/orders/my') // sesuaikan route
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body?.orders)).toBe(true);
    expect(res.body.orders[0].status).toBe('Not Process');
  });

  test('200: update order status by admin → persisted', async () => {
    const adminToken = signTestUser({ role: 1 });
    const userId = '507f1f77bcf86cd799439011';
    const order = await Order.create({
      user: userId, items: [], status: 'Not Process', amount: 10
    });

    const res = await request(app)
      .put(`/api/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Shipped' });

    expect(res.statusCode).toBe(200);
    // reload
    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('Shipped');
  });
});
