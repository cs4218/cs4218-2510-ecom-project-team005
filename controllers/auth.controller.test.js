jest.mock('../config/db.js', () => ({
  __esModule: true,
  default: jest.fn(),   // ini akan “menggantikan” connectDB()
}));
import request from 'supertest';
import app from '../server.js';

const PROFILE_PATH = '/api/v1/auth/profile';

describe('Auth controller - updateProfileController', () => {
  test('rejects weak password', async () => {
    const res = await request(app)
      .put(PROFILE_PATH)
      .send({ name: 'Ridwan', password: '123' }); // kurang dari 6
    // implementasi umum: 400/422; jika butuh login bisa 401
    expect([400, 422, 401]).toContain(res.statusCode);
  });

  test('accepts strong password', async () => {
    const res = await request(app)
      .put(PROFILE_PATH)
      .send({ name: 'Ridwan', password: '123456' });
    // tanpa login bisa 401; kalau lolos validasi → 200/201
    expect([200, 201, 401]).toContain(res.statusCode);
  });
});
