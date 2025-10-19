import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { seedAll } from '../helpers/testDataSeeder.js';
import User from '../../models/userModel.js';

describe('PUT /api/v1/auth/profile (user)', () => {
  let token;

  beforeAll(async () => {
    await seedAll();
    const user = await User.findOne({ email: 'cs4218@test.com' }) || await User.findOne({ role: 0 });
    const SECRET = process.env.JWT_SECRET || 'HGFHGEAD12124322432';
    token = jwt.sign({ _id: String(user._id), name: user.name, email: user.email, role: user.role ?? 0 }, SECRET, { expiresIn: '1h' });
  });

  test('user bisa update profile', async () => {
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('authorization', token)
      .send({ name: 'Ridwan F', phone: '8123XXXX' });

    expect([200,201]).toContain(res.status);
    const out = res.body.user || res.body.data || {};
    expect(String(out.name || '').toLowerCase()).toContain('ridwan');
  });
});
