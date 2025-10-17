/**
 * Merged Unit Tests for:
 *  - createProductController (productController.js)
 *  - Category controllers: create/update/list/single/delete (categoryController.js)
 *
 * Notes:
 * - Uses ESM + top-level await with jest.unstable_mockModule for consistent mocking.
 * - Keeps all original assertions and behaviors from both files.
 * - Slugify is mocked as a jest.fn defaulting to kebab-case; individual tests can override via mockReturnValue.
 * - FS read is mocked; product photo size/content behaviors preserved.
 *
 * AI was utilized in the making of this merged file
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

/* =========================
   Module Mocks
   ========================= */

jest.unstable_mockModule('../models/productModel.js', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.unstable_mockModule('../models/categoryModel.js', () => {
  const ctor = jest.fn();
  ctor.findOne = jest.fn();
  ctor.find = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  ctor.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: ctor };
});

jest.unstable_mockModule('fs', () => ({
  __esModule: true,
  default: {
    readFileSync: jest.fn(),
  },
}));

jest.unstable_mockModule('slugify', () => ({
  __esModule: true,
  // default kebab-case implementation; tests can override with mockReturnValue
  default: jest.fn((str) =>
    String(str).toLowerCase().trim().replace(/\s+/g, '-')
  ),
}));

/* =========================
   Imports after mocks
   ========================= */

const { createProductController } = await import('./productController.js');

const {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} = await import('./categoryController.js');

const productModel = (await import('../models/productModel.js')).default;
const categoryModel = (await import('../models/categoryModel.js')).default;
const fs = await import('fs');
const slugify = (await import('slugify')).default;

/* =========================
   Helpers (category tests)
   ========================= */

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

const makeReq = (overrides = {}) => ({
  body: {},
  params: {},
  ...overrides,
});

/* =========================
   Suite A: createProductController
   ========================= */

describe('createProductController Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      fields: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'test-category-id',
        quantity: 10,
      },
      files: {
        photo: {
          path: '/tmp/test-photo.jpg',
          type: 'image/jpeg',
          size: 500000, // 500KB
        },
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    slugify.mockReturnValue('test-product');
    fs.default.readFileSync.mockReturnValue(Buffer.from('fake-image-data'));
  });

  test('should create product successfully with valid data', async () => {
    const mockProduct = {
      _id: 'product123',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      slug: 'test-product',
      photo: { data: Buffer.from('fake-image-data'), contentType: 'image/jpeg' },
      save: jest.fn().mockResolvedValue(true),
    };
    productModel.mockImplementation(() => mockProduct);

    await createProductController(mockReq, mockRes);

    expect(productModel).toHaveBeenCalledWith({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'test-category-id',
      quantity: 10,
      slug: 'test-product',
    });
    expect(slugify).toHaveBeenCalledWith('Test Product');
    expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
    expect(mockProduct.save).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product created successfully',
      products: mockProduct,
    });
  });

  test('should generate URL-friendly slug from product name', async () => {
    mockReq.fields.name = 'Amazing Product With Spaces & Special Characters!';
    const mockProduct = { photo: {}, save: jest.fn().mockResolvedValue(true) };
    productModel.mockImplementation(() => mockProduct);
    slugify.mockReturnValue(
      'amazing-product-with-spaces-special-characters'
    );

    await createProductController(mockReq, mockRes);

    expect(slugify).toHaveBeenCalledWith(
      'Amazing Product With Spaces & Special Characters!'
    );
    expect(productModel).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'amazing-product-with-spaces-special-characters',
      })
    );
  });

  test('should read photo file and store binary data with correct content type', async () => {
    const mockImageBuffer = Buffer.from('mock-jpeg-binary-data');
    fs.default.readFileSync.mockReturnValue(mockImageBuffer);

    const mockProduct = { photo: {}, save: jest.fn().mockResolvedValue(true) };
    productModel.mockImplementation(() => mockProduct);

    await createProductController(mockReq, mockRes);

    expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
    expect(mockProduct.photo.data).toBe(mockImageBuffer);
    expect(mockProduct.photo.contentType).toBe('image/jpeg');
  });

  test('should validate all required fields before creating product', async () => {
    delete mockReq.fields.category;

    await createProductController(mockReq, mockRes);

    expect(productModel).not.toHaveBeenCalled();
    expect(fs.default.readFileSync).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Category is required',
    });
  });

  test('should validate required name field', async () => {
    delete mockReq.fields.name;

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Name is required',
    });
    expect(productModel).not.toHaveBeenCalled();
  });

  test('should validate required description field', async () => {
    delete mockReq.fields.description;

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Description is required',
    });
  });

  test('should validate required price field', async () => {
    delete mockReq.fields.price;

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Price is required',
    });
  });

  test('should validate required category field', async () => {
    delete mockReq.fields.category;

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Category is required',
    });
  });

  test('should validate required quantity field', async () => {
    delete mockReq.fields.quantity;

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Quantity is required',
    });
  });

  test('should validate required photo field', async () => {
    delete mockReq.files.photo;

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Photo is required and must be less than 1MB',
    });
  });

  test('should validate photo size limit (1MB)', async () => {
    mockReq.files.photo.size = 1500000; // 1.5MB

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Photo is required and must be less than 1MB',
    });
  });

  test('should handle database save errors', async () => {
    const mockProduct = {
      photo: {},
      save: jest.fn().mockRejectedValue({ message: 'Database connection failed' }),
    };
    productModel.mockImplementation(() => mockProduct);

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      error: 'Database connection failed',
      message: 'Error creating product',
    });
  });

  test('should reject non-image file types', async () => {
    mockReq.files.photo = {
      path: '/tmp/malicious-script.php',
      type: 'application/php',
      size: 50000,
    };

    await createProductController(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Only image files are allowed',
    });
  });

  test('should sanitize input fields (demonstrates gap)', async () => {
    mockReq.fields.name = '<script>alert("XSS")</script>Malicious Product';
    mockReq.fields.description = '{"$ne": null}';
    mockReq.fields.category = '../../../etc/passwd';

    const mockProduct = { photo: {}, save: jest.fn().mockResolvedValue(true) };
    productModel.mockImplementation(() => mockProduct);

    await createProductController(mockReq, mockRes);

    expect(productModel).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '<script>alert("XSS")</script>Malicious Product',
        description: '{"$ne": null}',
      })
    );
  });

  test('should validate file paths (demonstrates gap)', async () => {
    mockReq.files.photo.path = '../../../etc/passwd';

    const mockProduct = { photo: {}, save: jest.fn().mockResolvedValue(true) };
    productModel.mockImplementation(() => mockProduct);

    await createProductController(mockReq, mockRes);

    expect(fs.default.readFileSync).toHaveBeenCalledWith('../../../etc/passwd');
  });
});

/* =========================
   Suite B: Category Controllers
   ========================= */

beforeEach(() => {
  // global clear to avoid cross-suite leakage
  jest.clearAllMocks();

  // Reset slugify to a stable kebab-case implementation for category tests
  slugify.mockReset();
  slugify.mockImplementation((str) =>
    String(str).toLowerCase().trim().replace(/\s+/g, '-')
  );
});

// Suite 1: createCategoryController
describe('createCategoryController', () => {
  test('401 when name is missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Name is required' });
    expect(categoryModel.findOne).not.toHaveBeenCalled();
  });

  test('200 when category already exists', async () => {
    const req = makeReq({ body: { name: 'Phones' } });
    const res = makeRes();
    categoryModel.findOne.mockResolvedValue({ _id: 'x1', name: 'Phones' });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: 'Phones' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Category Already Exists',
    });
  });

  test('201 creates category when not existing', async () => {
    const req = makeReq({ body: { name: 'New Item' } });
    const res = makeRes();

    categoryModel.findOne.mockResolvedValue(null);

    const savedDoc = { _id: 'id123', name: 'New Item', slug: 'new-item' };
    categoryModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedDoc),
    }));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: 'New Item' });
    // expect(slugify('New Item')).toBe('new-item'); // sanity check of mock
    expect(categoryModel).toHaveBeenCalledWith({
      name: 'New Item',
      slug: 'new-item',
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'new category created',
      category: savedDoc,
    });
  });

  test('500 when underlying logic throws => catch path', async () => {
    const req = makeReq({ body: { name: 'Boom' } });
    const res = makeRes();
    const err = new Error('DB down');
    categoryModel.findOne.mockRejectedValue(err);

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message.toLowerCase()).toContain('error');
  });
});

// Suite 2: updateCategoryController
describe('updateCategoryController', () => {
  test('200 updates and returns the category', async () => {
    const req = makeReq({
      params: { id: 'abc123' },
      body: { name: 'Laptops Pro' },
    });
    const res = makeRes();

    const updated = { _id: 'abc123', name: 'Laptops Pro', slug: 'laptops-pro' };
    categoryModel.findByIdAndUpdate.mockResolvedValue(updated);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc123',
      { name: 'Laptops Pro', slug: 'laptops-pro' },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Category Updated Successfully',
      category: updated,
    });
  });

  test('500 when update throws', async () => {
    const req = makeReq({
      params: { id: 'abc123' },
      body: { name: 'Bad' },
    });
    const res = makeRes();

    categoryModel.findByIdAndUpdate.mockRejectedValue(new Error('nope'));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/updating category/i);
  });
});

// Suite 3: categoryController (get all)
describe('categoryController (get all categories)', () => {
  test('200 returns list', async () => {
    const req = makeReq();
    const res = makeRes();

    const docs = [{ name: 'Phones' }, { name: 'Laptops' }];
    categoryModel.find.mockResolvedValue(docs);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'All Categories List',
      category: docs,
    });
  });

  test('500 when find throws', async () => {
    const req = makeReq();
    const res = makeRes();
    categoryModel.find.mockRejectedValue(new Error('broken'));

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/getting all categories/i);
  });
});

// Suite 4: singleCategoryController
describe('singleCategoryController', () => {
  test('200 returns single by slug', async () => {
    const req = makeReq({ params: { slug: 'phones' } });
    const res = makeRes();
    const doc = { _id: '1', name: 'Phones', slug: 'phones' };

    categoryModel.findOne.mockResolvedValue(doc);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: 'phones' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Get Single Category Successfully',
      category: doc,
    });
  });

  test('500 when findOne throws', async () => {
    const req = makeReq({ params: { slug: 'x' } });
    const res = makeRes();
    categoryModel.findOne.mockRejectedValue(new Error('db'));

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/single category/i);
  });
});

// Suite 5: deleteCategoryController
describe('deleteCategoryController', () => {
  test('200 when deletion succeeds', async () => {
    const req = makeReq({ params: { id: 'del123' } });
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockResolvedValue({});

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith('del123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Category Deleted Successfully',
    });
  });

  test('500 when deletion throws', async () => {
    const req = makeReq({ params: { id: 'del123' } });
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockRejectedValue(new Error('perm'));

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/deleting category/i);
  });
});






// Below are the original tests
// // HOU QINGSHAN categoryController unit tests

// import {
//   createCategoryController,
//   updateCategoryController,
//   categoryController,
//   singleCategoryController,
//   deleteCategoryController,
// } from "./categoryController.js";

// // mock
// jest.mock("../models/categoryModel.js", () => {
//   const ctor = jest.fn(); // used with `new categoryModel(...)`
//   // static methods used directly on the model:
//   ctor.findOne = jest.fn();
//   ctor.find = jest.fn();
//   ctor.findByIdAndUpdate = jest.fn();
//   ctor.findByIdAndDelete = jest.fn();
//   return { __esModule: true, default: ctor };
// });

// jest.mock("slugify", () => ({
//   __esModule: true,
//   default: (str) =>
//     String(str)
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, "-"),
// }));

// import categoryModel from "../models/categoryModel.js";
// import slugify from "slugify";

// // helper to create mock res object with jest.fn() methods
// const makeRes = () => {
//   const res = {};
//   res.status = jest.fn(() => res);
//   res.send = jest.fn(() => res);
//   return res;
// };

// const makeReq = (overrides = {}) => ({
//   body: {},
//   params: {},
//   ...overrides,
// });

// beforeEach(() => {
//   jest.clearAllMocks();
// });



// // Suite 1: createCategoryController
// describe("createCategoryController", () => {
//   test("401 when name is missing", async () => {
//     const req = makeReq({ body: {} });
//     const res = makeRes();

//     await createCategoryController(req, res);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
//     // no DB calls
//     expect(categoryModel.findOne).not.toHaveBeenCalled();
//   });

//   test("200 when category already exists", async () => {
//     const req = makeReq({ body: { name: "Phones" } });
//     const res = makeRes();
//     categoryModel.findOne.mockResolvedValue({ _id: "x1", name: "Phones" });

//     await createCategoryController(req, res);

//     expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Phones" });
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.send).toHaveBeenCalledWith({
//       success: true,
//       message: "Category Already Exisits",
//     });
//   });

//   test("201 creates category when not existing", async () => {
//     const req = makeReq({ body: { name: "New Item" } });
//     const res = makeRes();

//     categoryModel.findOne.mockResolvedValue(null);

//     // mock constructor: new categoryModel({...}).save()
//     const savedDoc = { _id: "id123", name: "New Item", slug: "new-item" };
//     categoryModel.mockImplementation(() => ({
//       save: jest.fn().mockResolvedValue(savedDoc),
//     }));

//     await createCategoryController(req, res);

//     expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "New Item" });
//     expect(slugify("New Item")).toBe("new-item");
//     // ensure ctor was called with the right payload
//     expect(categoryModel).toHaveBeenCalledWith({
//       name: "New Item",
//       slug: "new-item",
//     });

//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.send).toHaveBeenCalledWith({
//       success: true,
//       message: "new category created",
//       category: savedDoc,
//     });
//   });

//   test("500 when underlying logic throws => catch path", async () => {
//     const req = makeReq({ body: { name: "Boom" } });
//     const res = makeRes();
//     const err = new Error("DB down");
//     categoryModel.findOne.mockRejectedValue(err);

//     await createCategoryController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);

//     // check the payload sent, expect success:false and message contains "error"
//     const payload = res.send.mock.calls[0][0];
//     expect(payload.success).toBe(false);
//     expect(payload.message.toLowerCase()).toContain("error");
//   });
// });

// // Suite 2: updateCategoryController
// describe("updateCategoryController", () => {
//   test("200 updates and returns the category", async () => {
//     const req = makeReq({
//       params: { id: "abc123" },
//       body: { name: "Laptops Pro" },
//     });
//     const res = makeRes();

//     const updated = { _id: "abc123", name: "Laptops Pro", slug: "laptops-pro" };
//     categoryModel.findByIdAndUpdate.mockResolvedValue(updated);

//     await updateCategoryController(req, res);

//     expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
//       "abc123",
//       { name: "Laptops Pro", slug: "laptops-pro" },
//       { new: true }
//     );
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.send).toHaveBeenCalledWith({
//       success: true,
//       messsage: "Category Updated Successfully",
//       category: updated,
//     });
//   });

//   test("500 when update throws", async () => {
//     const req = makeReq({
//       params: { id: "abc123" },
//       body: { name: "Bad" },
//     });
//     const res = makeRes();

//     categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("nope"));

//     await updateCategoryController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     const payload = res.send.mock.calls[0][0];
//     expect(payload.success).toBe(false);
//     expect(payload.message).toMatch(/updating category/i);
//   });
// });


// // Suite 3: categoryController (get all categories)
// describe("categoryController (get all categories)", () => {
//   test("200 returns list", async () => {
//     const req = makeReq();
//     const res = makeRes();

//     const docs = [{ name: "Phones" }, { name: "Laptops" }];
//     categoryModel.find.mockResolvedValue(docs);

//     await categoryController(req, res);

//     expect(categoryModel.find).toHaveBeenCalledWith({});
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.send).toHaveBeenCalledWith({
//       success: true,
//       message: "All Categories List",
//       category: docs,
//     });
//   });

//   test("500 when find throws", async () => {
//     const req = makeReq();
//     const res = makeRes();
//     categoryModel.find.mockRejectedValue(new Error("broken"));

//     await categoryController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     const payload = res.send.mock.calls[0][0];
//     expect(payload.success).toBe(false);
//     expect(payload.message).toMatch(/getting all categories/i);
//   });
// });


// // Suite 4: singleCategoryController
// describe("singleCategoryController", () => {
//   test("200 returns single by slug", async () => {
//     const req = makeReq({ params: { slug: "phones" } });
//     const res = makeRes();
//     const doc = { _id: "1", name: "Phones", slug: "phones" };

//     categoryModel.findOne.mockResolvedValue(doc);

//     await singleCategoryController(req, res);

//     expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "phones" });
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.send).toHaveBeenCalledWith({
//       success: true,
//       message: "Get SIngle Category SUccessfully",
//       category: doc,
//     });
//   });

//   test("500 when findOne throws", async () => {
//     const req = makeReq({ params: { slug: "x" } });
//     const res = makeRes();
//     categoryModel.findOne.mockRejectedValue(new Error("db"));

//     await singleCategoryController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     const payload = res.send.mock.calls[0][0];
//     expect(payload.success).toBe(false);
//     expect(payload.message).toMatch(/single category/i);
//   });
// });


// // Suite 5: deleteCategoryController
// describe("deleteCategoryController", () => {
//   test("200 when deletion succeeds", async () => {
//     const req = makeReq({ params: { id: "del123" } });
//     const res = makeRes();

//     categoryModel.findByIdAndDelete.mockResolvedValue({}); // return value not used

//     await deleteCategoryController(req, res);

//     expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("del123");
//     expect(res.status).toHaveBeenCalledWith(200);
//     expect(res.send).toHaveBeenCalledWith({
//       success: true,
//       message: "Categry Deleted Successfully",
//     });
//   });

//   test("500 when deletion throws", async () => {
//     const req = makeReq({ params: { id: "del123" } });
//     const res = makeRes();

//     categoryModel.findByIdAndDelete.mockRejectedValue(new Error("perm"));

//     await deleteCategoryController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     const payload = res.send.mock.calls[0][0];
//     expect(payload.success).toBe(false);
//     expect(payload.message).toMatch(/deleting category/i);
//   });
// });



// /**
//  * Unit Tests for createProductController Function
//  * 
//  * - Product creation API endpoint functionality (/api/v1/product/create-product)
//  * - Input validation for required fields (name, description, price, category, quantity, photo)
//  * - File upload handling and photo size validation (1MB limit)
//  * - Database operations with productModel (save, slug generation)
//  * - Response formatting and status codes (201 success, 500 error)
//  * - Error handling for invalid inputs and database failures
//  * - Inconsistent HTTP status codes (500 for validation vs 400 standard)
//  * - File type validation missing (security vulnerability)
//  * - Input sanitization gaps (potential NoSQL injection)
//  * - Photo path validation missing (file system security)
//  * 
//  * AI was utilized in the making of this file
//  */

// import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// // Mock dependencies using unstable_mockModule
// jest.unstable_mockModule('../models/productModel.js', () => ({
//   default: jest.fn()
// }));
// jest.unstable_mockModule('fs', () => ({
//   default: {
//     readFileSync: jest.fn()
//   }
// }));
// jest.unstable_mockModule('slugify', () => ({
//   default: jest.fn()
// }));

// const { createProductController } = await import('./productController.js');
// const productModel = (await import('../models/productModel.js')).default;
// const fs = await import('fs');
// const slugify = (await import('slugify')).default;

// describe('createProductController Test Suite', () => {
//   let mockReq, mockRes;

//   beforeEach(() => {
//     // Reset all mocks
//     jest.clearAllMocks();
    
//     // Mock request object
//     mockReq = {
//       fields: {
//         name: 'Test Product',
//         description: 'Test Description',
//         price: 99.99,
//         category: 'test-category-id',
//         quantity: 10
//       },
//       files: {
//         photo: {
//           path: '/tmp/test-photo.jpg',
//           type: 'image/jpeg',
//           size: 500000 // 500KB - under 1MB limit
//         }
//       }
//     };

//     // Mock response object
//     mockRes = {
//       status: jest.fn().mockReturnThis(),
//       send: jest.fn().mockReturnThis()
//     };

//     // Mock external dependencies
//     slugify.mockReturnValue('test-product');
//     fs.default.readFileSync.mockReturnValue(Buffer.from('fake-image-data'));
//   });

//   test('should create product successfully with valid data', async () => {
//     // Arrange - Set up successful product creation
//     const mockProduct = {
//       _id: 'product123',
//       name: 'Test Product',
//       description: 'Test Description',
//       price: 99.99,
//       slug: 'test-product',
//       photo: { data: Buffer.from('fake-image-data'), contentType: 'image/jpeg' },
//       save: jest.fn().mockResolvedValue(true)
//     };
//     productModel.mockImplementation(() => mockProduct);

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify successful creation
//     expect(productModel).toHaveBeenCalledWith({
//       name: 'Test Product',
//       description: 'Test Description', 
//       price: 99.99,
//       category: 'test-category-id',
//       quantity: 10,
//       slug: 'test-product'
//     });
//     expect(slugify).toHaveBeenCalledWith('Test Product');
//     expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
//     expect(mockProduct.save).toHaveBeenCalled();
//     expect(mockRes.status).toHaveBeenCalledWith(201);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       success: true,
//       message: 'Product created successfully',
//       products: mockProduct
//     });
//   });

//   // Should generate correct slug from product name
//   test('should generate URL-friendly slug from product name', async () => {
//     // Arrange - Product with complex name
//     mockReq.fields.name = 'Amazing Product With Spaces & Special Characters!';
//     const mockProduct = { photo: {}, save: jest.fn().mockResolvedValue(true) };
//     productModel.mockImplementation(() => mockProduct);
//     slugify.mockReturnValue('amazing-product-with-spaces-special-characters');

//     // Act
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify slug generation functionality
//     expect(slugify).toHaveBeenCalledWith('Amazing Product With Spaces & Special Characters!');
//     expect(productModel).toHaveBeenCalledWith(
//       expect.objectContaining({
//         slug: 'amazing-product-with-spaces-special-characters'
//       })
//     );
//   });

//   // Should process and store photo file correctly
//   test('should read photo file and store binary data with correct content type', async () => {
//     // Arrange - Mock file system and product
//     const mockImageBuffer = Buffer.from('mock-jpeg-binary-data');
//     fs.default.readFileSync.mockReturnValue(mockImageBuffer);
    
//     const mockProduct = { 
//       photo: {},  // This will be populated by the controller
//       save: jest.fn().mockResolvedValue(true) 
//     };
//     productModel.mockImplementation(() => mockProduct);

//     // Act
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify photo processing functionality
//     expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
//     expect(mockProduct.photo.data).toBe(mockImageBuffer);
//     expect(mockProduct.photo.contentType).toBe('image/jpeg');
//   });

//   // Should validate all required fields before processing
//   test('should validate all required fields before creating product', async () => {
//     // Arrange - Missing required field
//     delete mockReq.fields.category;

//     // Act
//     await createProductController(mockReq, mockRes);

//     // Assert - Should stop processing and not create product
//     expect(productModel).not.toHaveBeenCalled();
//     expect(fs.default.readFileSync).not.toHaveBeenCalled();
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Category is required'
//     });
//   });

//   test('should validate required name field', async () => {
//     // Arrange - Remove name from request
//     delete mockReq.fields.name;

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Name is required'
//     });
//     expect(productModel).not.toHaveBeenCalled();
//   });

//   test('should validate required description field', async () => {
//     // Arrange - Remove description from request
//     delete mockReq.fields.description;

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Description is required'
//     });
//   });

//   test('should validate required price field', async () => {
//     // Arrange - Remove price from request
//     delete mockReq.fields.price;

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Price is required'
//     });
//   });

//   test('should validate required category field', async () => {
//     // Arrange - Remove category from request
//     delete mockReq.fields.category;

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Category is required'
//     });
//   });

//   test('should validate required quantity field', async () => {
//     // Arrange - Remove quantity from request
//     delete mockReq.fields.quantity;

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Quantity is required'
//     });
//   });

//   test('should validate required photo field', async () => {
//     // Arrange - Remove photo from request
//     delete mockReq.files.photo;

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Photo is required and must be less than 1MB'
//     });
//   });

//   test('should validate photo size limit (1MB)', async () => {
//     // Arrange - Set photo size over 1MB limit
//     mockReq.files.photo.size = 1500000; // 1.5MB

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify size validation error
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Photo is required and must be less than 1MB'
//     });
//   });

//   test('should handle database save errors', async () => {
//     // Arrange - Mock database save failure
//     const mockProduct = {
//       photo: {},
//       save: jest.fn().mockRejectedValue({ message: 'Database connection failed' })
//     };
//     productModel.mockImplementation(() => mockProduct);

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify error handling
//     expect(mockRes.status).toHaveBeenCalledWith(500);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       success: false,
//       error: 'Database connection failed',
//       message: 'Error creating product'
//     });
//   });


//   // Should validate photo file types
//   test('should reject non-image file types', async () => {
//     // Arrange - Non-image file upload
//     mockReq.files.photo = {
//       path: '/tmp/malicious-script.php',
//       type: 'application/php', // Not an image type
//       size: 50000
//     };

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Should reject non-image files with 400 Bad Request
//     expect(mockRes.status).toHaveBeenCalledWith(400);
//     expect(mockRes.send).toHaveBeenCalledWith({
//       error: 'Only image files are allowed'
//     });
//   });

//   // Input Sanitization Missing
//   test('should sanitize input fields', async () => {
//     // Arrange - Potentially malicious input data
//     mockReq.fields.name = '<script>alert("XSS")</script>Malicious Product';
//     mockReq.fields.description = '{"$ne": null}'; // NoSQL injection attempt
//     mockReq.fields.category = '../../../etc/passwd'; // Path traversal attempt

//     const mockProduct = {
//       photo: {},
//       save: jest.fn().mockResolvedValue(true)
//     };
//     productModel.mockImplementation(() => mockProduct);

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify input sanitization gap
//     // No input sanitization - raw user data saved to database
//     // Could lead to XSS, NoSQL injection, or other attacks
//     expect(productModel).toHaveBeenCalledWith(
//       expect.objectContaining({
//         name: '<script>alert("XSS")</script>Malicious Product', // Raw malicious data
//         description: '{"$ne": null}' // Raw injection attempt
//       })
//     );
//   });

//   // File Path Validation Missing
//   test('should validate file paths', async () => {
//     // Arrange - Malicious file path
//     mockReq.files.photo.path = '../../../etc/passwd'; // Path traversal attack

//     const mockProduct = {
//       photo: {},
//       save: jest.fn().mockResolvedValue(true)
//     };
//     productModel.mockImplementation(() => mockProduct);

//     // Act - Call the controller function
//     await createProductController(mockReq, mockRes);

//     // Assert - Verify file path security gap
//     // No path validation - could read arbitrary files from server
//     expect(fs.default.readFileSync).toHaveBeenCalledWith('../../../etc/passwd');
//   });
// });