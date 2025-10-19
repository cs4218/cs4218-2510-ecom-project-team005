import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDb, resetDb, closeDb } from '../helpers/dbTestUtils.js';
import { seedBasic } from '../helpers/testDataSeeder.js';
import { signTestToken } from '../helpers/authToken.js';

const API = '/api/v1/auth';

describe('Admin Get All Orders', () => {
  let admin, token;

  beforeAll(async () => {
    await connectTestDb(process.env.MONGO_URL);
    ({ admin } = await seedBasic());
    token = signTestToken({ _id: admin._id, role: 'admin', email: admin.email });
  });

  afterAll(async () => {
    await resetDb();
    await closeDb();
  });

  test('200: admin melihat semua orders (>=1 dari seed)', async () => {
    const res = await request(app)
      .get(`${API}/all-orders`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const orders = res.body?.orders || res.body?.data || [];
    const total  = res.body?.total  || orders.length;
    expect(total).toBeGreaterThanOrEqual(1); // set ≥2 kalau seed kamu buat 2 order
  });
});
