import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDb, resetDb, closeDb } from '../helpers/dbTestUtils.js';
import { seedBasic } from '../helpers/testDataSeeder.js';
import { signTestToken } from '../helpers/authToken.js';

const API = '/api/v1/auth';

describe('Get My Orders (user)', () => {
  let user, token;

  beforeAll(async () => {
    await connectTestDb(process.env.MONGO_URL);
    ({ user } = await seedBasic());
    token = signTestToken({ _id: user._id, role: 'user', email: user.email });
  });

  afterAll(async () => {
    await resetDb();
    await closeDb();
  });

  test('200: mengembalikan hanya orders milik user login', async () => {
    const res = await request(app)
      .get(`${API}/orders`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const orders = res.body?.orders || res.body?.data || [];
    expect(Array.isArray(orders)).toBe(true);

    if (orders.length) {
      const allMine = orders.every(o => String(o.user) === String(user._id));
      expect(allMine).toBe(true);
    }
  });
});
