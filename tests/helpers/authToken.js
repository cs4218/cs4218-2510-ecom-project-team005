// tests/helpers/authToken.js
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'HGFHGEAD12124322432';

// JWT versi real project: hanya _id (sesuai loginController)
export function signTestUser() {
  const payload = { _id: '507f1f77bcf86cd799439011' };
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function signTestAdmin() {
  const payload = { _id: '507f1f77bcf86cd799439012' }; // beda ID aja
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}
