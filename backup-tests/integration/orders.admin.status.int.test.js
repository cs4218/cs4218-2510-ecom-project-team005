import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDb, resetDb, closeDb } from '../helpers/dbTestUtils.js';
import { seedBasic } from '../helpers/testDataSeeder.js';
import { signTestToken } from '../helpers/authToken.js';
import Order from '../../src/models/orderModel.js';

const API = '/api/v1/auth';

describe('Admin Update Order Status', () => {
  let admin, token, order;

  beforeAll(async () => {
    await connectTestDb(process.env.MONGO_URL);
    ({ admin, order } = await seedBasic());
    token = signTestToken({ _id: admin._id, role: 'admin', email: admin.email });
  });

  afterAll(async () => {
    await resetDb();
    await closeDb();
  });

  test('200: admin mengubah status order menjadi delivered', async () => {
    const res = await request(app)
      .put(`${API}/order-status/${order._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'delivered' });

    expect(res.status).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated?.status?.toLowerCase()).toBe('delivered');
  });
});
