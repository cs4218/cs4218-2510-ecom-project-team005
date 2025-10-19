import request from 'supertest';
import app from '../../app.js';
import '../setup/db.setup.js';
import { signTestUser } from '../helpers/authToken.js';

describe('Profile integration', () => {
  test('200: user can update name & phone', async () => {
    const token = signTestUser();
    // seed: create user jika controller butuh existing doc
    // bisa lewat direct model atau endpoint register (pilih yang paling cepat di project kamu)

    const res = await request(app)
      .put('/api/profile') // sesuaikan route kamu
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ridwan Update', phone: '08123456789' });

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.user?.name).toBe('Ridwan Update');
    expect(res.body?.user?.phone).toBe('08123456789');
  });

  test('401: reject when no token', async () => {
    const res = await request(app)
      .put('/api/profile')
      .send({ name: 'X' });
    expect(res.statusCode).toBe(401);
  });
});
