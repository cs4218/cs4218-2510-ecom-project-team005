import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDb, resetDb, closeDb } from '../helpers/dbTestUtils.js';
import { seedBasic } from '../helpers/testDataSeeder.js';
import { signTestToken } from '../helpers/authToken.js';

// Ganti jika prefix mount di app.js berbeda
const API = '/api/v1/auth';

describe('Update Profile (user)', () => {
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

  test('200: user bisa update name & phone', async () => {
    const res = await request(app)
      .put(`${API}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ridwan F', phone: '0812xxxx' });

    expect(res.status).toBe(200);
    expect(res.body?.user?.name).toBe('Ridwan F');
    expect(res.body?.user?.phone).toBe('0812xxxx');
  });

  test('400/422: invalid body ditolak', async () => {
    const res = await request(app)
      .put(`${API}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' }); // contoh invalid

    expect([400, 422]).toContain(res.status);
  });
});
