import request from 'supertest';
import app from '../server.js';

describe('GET /', () => {
  it('returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Welcome to ecommerce app/i);
  });
});
