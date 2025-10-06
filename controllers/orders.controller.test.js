jest.mock('../config/db.js', () => ({
  __esModule: true,
  default: jest.fn(),   // ini akan “menggantikan” connectDB()
}));
import request from 'supertest';
import app from '../server.js';

// full paths sesuai routes kamu
const ORDERS_PATH = '/api/v1/auth/orders';
const ALL_ORDERS_PATH = '/api/v1/auth/all-orders';
const STATUS_PATH = '/api/v1/auth/order-status';

describe('Orders controllers (smoke)', () => {
  test('GET user orders responds', async () => {
    const res = await request(app).get(ORDERS_PATH);
    // karena requireSignIn, hasil bisa 401/403 saat tidak login; kalau lolos: 200/201
    expect([200, 201, 401, 403]).toContain(res.statusCode);
  });

  test('GET all orders (admin) responds', async () => {
    const res = await request(app).get(ALL_ORDERS_PATH);
    expect([200, 201, 401, 403]).toContain(res.statusCode);
  });

  test('PUT order status responds', async () => {
    const res = await request(app)
      .put(`${STATUS_PATH}/dummyOrderId`)   // NOTE: PUT, bukan PATCH
      .send({ status: 'Shipped' });
    expect([200, 201, 400, 401, 403, 404]).toContain(res.statusCode);
  });
});
