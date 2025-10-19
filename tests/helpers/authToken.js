import jwt from 'jsonwebtoken';

export function signTestUser(overrides = {}) {
  const payload = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test User',
    email: 'user@test.com',
    role: 0,
    ...overrides
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function signTestAdmin() {
  return signTestUser({ role: 1, email: 'admin@test.com' });
}
