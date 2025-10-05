// controllers/orders.controllers.unit.test.js (CJS)

// 1) siapkan mock untuk orderModel
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();

// helper untuk bikin "query" yang bisa di-chain dan di-await (thenable)
const makeThenableQuery = (result) => {
  const q = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(result), // bikin await q bekerja
  };
  return q;
};

// 2) mock orderModel SEBELUM require controller
jest.mock('../models/orderModel.js', () => ({
  __esModule: true,
  default: class Order {
    static find = mockFind;
    static findByIdAndUpdate = mockFindByIdAndUpdate;
  },
}));

// 3) baru require controller & util
const {
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} = require('../controllers/authController.js'); // PERHATIKAN: fungsi orders memang didefinisikan di file authController.js sesuai kode kamu

const { mockReq, mockRes } = require('./__testutils__/reqRes.js');

// optional: bisukan console.log biar output test bersih
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Orders controller (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getOrdersController mengembalikan daftar orders milik user', async () => {
    const fakeOrders = [
      { _id: 'o1', status: 'Created' },
      { _id: 'o2', status: 'Delivered' },
    ];
    // find(...).populate().populate() → await → result
    mockFind.mockReturnValueOnce(makeThenableQuery(fakeOrders));

    const req = mockReq({}, {}, { _id: 'u1' });
    const res = mockRes();

    await getOrdersController(req, res);

    // controller pakai res.json(orders) → status default 200
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.payload)).toBe(true);
    expect(res.payload.length).toBe(2);
  });

  test('getAllOrdersController mengembalikan semua orders (dengan sort)', async () => {
    const fakeOrders = [
      { _id: 'o2', status: 'Delivered' },
      { _id: 'o1', status: 'Created' },
    ];
    // find({}).populate().populate().sort().then(...)
    mockFind.mockReturnValueOnce(makeThenableQuery(fakeOrders));

    const req = mockReq();
    const res = mockRes();

    await getAllOrdersController(req, res);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.payload)).toBe(true);
    expect(res.payload[0]._id).toBe('o2');
  });

  test('orderStatusController mengubah status order dan mengembalikan objek order', async () => {
    const updated = { _id: 'o1', status: 'Delivered' };
    mockFindByIdAndUpdate.mockResolvedValueOnce(updated);

    const req = mockReq({ status: 'Delivered' }, { orderId: 'o1' });
    const res = mockRes();

    await orderStatusController(req, res);

    // controller pakai res.json(orders) → status default 200
    expect(res.statusCode).toBe(200);
    expect(res.payload.status).toBe('Delivered');
  });
});
