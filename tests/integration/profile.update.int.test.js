// tests/integration/profile.update.int.test.js
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { seedAll } from '../helpers/testDataSeeder.js';
import User from '../../models/userModel.js';

describe('PUT /api/v1/auth/profile (user)', () => {
  let token, userId;

  beforeAll(async () => {
    await seedAll();
    const user =
      (await User.findOne({ email: 'cs4218@test.com' })) ||
      (await User.findOne({ role: 0 }));
    if (!user) throw new Error('User test tidak ditemukan');
    userId = String(user._id);

    const SECRET = process.env.JWT_SECRET || 'HGFHGEAD12124322432';
    token = jwt.sign(
      { _id: userId, name: user.name, email: user.email, role: user.role ?? 0 },
      SECRET,
      { expiresIn: '1h' }
    );
  });

  test('user bisa update profile (verifikasi ke DB)', async () => {
    const NEW_NAME = 'Ridwan F';
    const res = await request(app)
      .put('/api/v1/auth/profile')
      .set('authorization', token)
      .send({ name: NEW_NAME, phone: '8123XXXX' });

    expect([200, 201]).toContain(res.status);

    // verifikasi langsung ke DB
    const updated = await User.findById(userId);
    expect(String(updated.name).toLowerCase()).toContain('ridwan');
  });
});
