// controllers/auth.update.unit.test.js (CJS, konsisten dengan config kamu)

// 1) siapkan mock function yang dipakai userModel
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockSave = jest.fn();

// 2) mock model User SEBELUM require controller
jest.mock('../models/userModel.js', () => ({
  __esModule: true,
  default: class User {
    constructor(doc) { Object.assign(this, doc); }
    static findById = mockFindById;
    static findByIdAndUpdate = mockFindByIdAndUpdate;
    save = mockSave;
  },
}));

// 3) mock helper hashing
jest.mock('../helpers/authHelper.js', () => ({
  __esModule: true,
  hashPassword: async (p) => `hashed(${p})`,
  comparePassword: async (p, hp) => hp === `hashed(${p})`,
}));

// 4) baru require controller & util
const authController = require('../controllers/authController.js');
const { updateProfileController } = authController;
const { mockReq, mockRes } = require('./__testutils__/reqRes.js');

describe('updateProfileController (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('menolak password < 6 (status tetap 200, payload.error ada)', async () => {
    // controller tetap memanggil findById lebih dulu
    mockFindById.mockResolvedValueOnce({ _id: 'u1', name: 'Lama', password: 'hashed(old)' });

    const req = mockReq({ name: 'Ridwan', password: '123' }, {}, { _id: 'u1' });
    const res = mockRes();

    await updateProfileController(req, res);

    expect(res.statusCode).toBe(200);          // sesuai implementasi: res.json(...) tanpa res.status
    expect(res.payload?.error).toBeDefined();  // pastikan ada error di payload
  });

  test('berhasil update dengan password kuat (200/201)', async () => {
    mockFindById.mockResolvedValueOnce({ _id: 'u1', name: 'Lama', password: 'hashed(old)' });
    mockFindByIdAndUpdate.mockResolvedValueOnce({
      _id: 'u1',
      name: 'Ridwan',
      password: 'hashed(123456)',
      phone: '081',
      address: 'Jalan',
    });
    mockSave.mockResolvedValueOnce(true);

    const req = mockReq({ name: 'Ridwan', password: '123456' }, {}, { _id: 'u1' });
    const res = mockRes();

    await updateProfileController(req, res);

    expect([200, 201]).toContain(res.statusCode);
    expect(res.payload).toBeDefined();
    expect(res.payload.updatedUser?.name).toBe('Ridwan');
  });
});
