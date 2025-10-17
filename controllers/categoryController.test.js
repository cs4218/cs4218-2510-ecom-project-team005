/**
 * Merged Unit Tests for categoryController.js
 *
 * - Keeps ALL suites from both original files:
 *   1) createCategoryController / updateCategoryController / categoryController / singleCategoryController / deleteCategoryController
 *   2) Category Controller Test Suite (functional-style checks)
 *
 * - ESM-friendly: uses jest.unstable_mockModule + top-level await
 * - Mocked categoryModel acts as a constructor + has static methods (find, findOne, findByIdAndUpdate, findByIdAndDelete)
 * - slugify mocked to stable kebab-case implementation so tests like slugify('New Item') === 'new-item' pass
 *
 * AI was utilized in the making of this merged file
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

/* ---------------------------------
 * Mocks (ESM style, before imports)
 * --------------------------------- */

// categoryModel: constructor with .save() AND static methods used by controllers/tests
jest.unstable_mockModule('../models/categoryModel.js', () => {
  const ctor = jest.fn((doc = {}) => {
    // Each constructed instance gets its own save mock (tests may override via implementation)
    return {
      ...doc,
      save: jest.fn(), // tests set resolved value where needed
    };
  });
  // Static/Model methods used by controllers
  ctor.findOne = jest.fn();
  ctor.find = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  ctor.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: ctor };
});

// slugify: stable kebab-case mock (tests may still call/inspect it)
jest.unstable_mockModule('slugify', () => ({
  __esModule: true,
  default: jest.fn((str) =>
    String(str).toLowerCase().trim().replace(/\s+/g, '-')
  ),
}));

// Import controllers AFTER mocks are in place
const {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} = await import('./categoryController.js');

// Pull the mocked modules for direct access in tests
const categoryModel = (await import('../models/categoryModel.js')).default;
const slugify = (await import('slugify')).default;

/* ---------------------------------
 * Helpers shared across suites
 * --------------------------------- */

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = (overrides = {}) => ({
  body: {},
  params: {},
  ...overrides,
});

/* =======================================================================================
   File #1 content (as provided) — minimal changes: use shared mocks and keep expectations
   ======================================================================================= */

// Global reset before the first file’s suites (mirrors your original file)
beforeEach(() => {
  jest.clearAllMocks();
});

// Suite 1: createCategoryController
describe('createCategoryController', () => {
  test('401 when name is missing', async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Name is required' });
    // no DB calls
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

    // mock constructor: new categoryModel({...}).save()
    const savedDoc = { _id: 'id123', name: 'New Item', slug: 'new-item' };
    categoryModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedDoc),
    }));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: 'New Item' });
    expect(slugify('New Item')).toBe('new-item'); // kept from your original file
    // ensure ctor was called with the right payload
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

    // check the payload sent, expect success:false and message contains "error"
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

// Suite 3: categoryController (get all categories)
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

    categoryModel.findByIdAndDelete.mockResolvedValue({}); // return value not used

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

/* =======================================================================================
   File #2 content (as provided) — adapted to reuse the same shared mocks/fixtures
   ======================================================================================= */

describe('Category Controller Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock request and response objects
    mockReq = { params: {} };
    mockRes = makeRes();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('categoryController Test Suite', () => {
    test('should return all categories successfully', async () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
      ];
      categoryModel.find.mockResolvedValue(mockCategories);

      await categoryController(mockReq, mockRes);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual(mockCategories);
    });

    test('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      categoryModel.find.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await categoryController(mockReq, mockRes);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      expect(mockRes.status).toHaveBeenCalledWith(500);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(false);
      expect(sendCall.error).toBeDefined();
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    test('should return empty array when no categories exist', async () => {
      categoryModel.find.mockResolvedValue([]);

      await categoryController(mockReq, mockRes);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual([]);
    });
  });

  describe('singleCategoryController Test Suite', () => {
    test('should return single category successfully', async () => {
      const mockCategory = { _id: '1', name: 'Electronics', slug: 'electronics' };
      const slug = 'electronics';
      mockReq.params.slug = slug;
      categoryModel.findOne.mockResolvedValue(mockCategory);

      await singleCategoryController(mockReq, mockRes);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug });
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual(mockCategory);
    });

    test('should handle database errors', async () => {
      const mockError = new Error('Database query failed');
      const slug = 'electronics';
      mockReq.params.slug = slug;
      categoryModel.findOne.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await singleCategoryController(mockReq, mockRes);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug });
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      expect(mockRes.status).toHaveBeenCalledWith(500);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(false);
      expect(sendCall.error).toBeDefined();
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    test('should handle category not found scenario', async () => {
      const slug = 'nonexistent';
      mockReq.params.slug = slug;
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(mockReq, mockRes);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug });
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toBeNull();
    });

    test('should handle missing slug parameter', async () => {
      mockReq.params = {}; // No slug parameter
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(mockReq, mockRes);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: undefined });
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toBeNull();
    });

    test('should handle special characters in slug parameter', async () => {
      const slug = 'electronics-&-gadgets';
      mockReq.params.slug = slug;
      const mockCategory = { _id: '1', name: 'Electronics & Gadgets', slug };
      categoryModel.findOne.mockResolvedValue(mockCategory);

      await singleCategoryController(mockReq, mockRes);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug });
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual(mockCategory);
    });
  });
});













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
//  * Unit Tests for categoryController.js
//  * 
//  * - Controller function structure and response handling
//  * - Database interaction and error handling
//  * - Response status codes and message formatting
//  * - Input validation and parameter processing
//  * - Model integration and data retrieval
//  * - Error scenarios and exception handling
//  * 
//  * AI was utilized in the making of this file
//  */

// import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
// import { jest } from '@jest/globals';

// // Mock the category model
// const mockCategoryModel = {
//   find: jest.fn(),
//   findOne: jest.fn()
// };

// // Mock the model import
// jest.unstable_mockModule('../models/categoryModel.js', () => ({
//   default: mockCategoryModel
// }));

// // Import controllers after mocking
// const { categoryController, singleCategoryController } = await import('./categoryController.js');

// describe('Category Controller Test Suite', () => {
//   let mockReq, mockRes;

//   beforeEach(() => {
//     // Reset all mocks before each test
//     jest.clearAllMocks();
    
//     // Setup mock request and response objects
//     mockReq = {
//       params: {}
//     };
    
//     mockRes = {
//       status: jest.fn().mockReturnThis(),
//       send: jest.fn().mockReturnThis(),
//       json: jest.fn().mockReturnThis()
//     };
//   });

//   afterEach(() => {
//     jest.resetAllMocks();
//   });

//   describe('categoryController Test Suite', () => {
//     test('should return all categories successfully', async () => {
//       // Arrange - Set up mock data and behavior
//       const mockCategories = [
//         { _id: '1', name: 'Electronics', slug: 'electronics' },
//         { _id: '2', name: 'Books', slug: 'books' }
//       ];
//       mockCategoryModel.find.mockResolvedValue(mockCategories);

//       // Act - Call the controller function
//       await categoryController(mockReq, mockRes);

//       // Assert - Verify correct behavior (test functionality, not exact messages)
//       expect(mockCategoryModel.find).toHaveBeenCalledWith({});
//       expect(mockRes.status).toHaveBeenCalledWith(200);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(true);
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);
//       expect(sendCall.category).toEqual(mockCategories);
//     });

//     test('should handle database errors', async () => {
//       // Arrange - Set up mock error
//       const mockError = new Error('Database connection failed');
//       mockCategoryModel.find.mockRejectedValue(mockError);
//       const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

//       // Act - Call the controller function
//       await categoryController(mockReq, mockRes);

//       // Assert - Verify error handling (test functionality, not exact messages)
//       expect(mockCategoryModel.find).toHaveBeenCalledWith({});
//       expect(consoleSpy).toHaveBeenCalledWith(mockError);
//       expect(mockRes.status).toHaveBeenCalledWith(500);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(false);
//       expect(sendCall.error).toBeDefined();
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);

//       consoleSpy.mockRestore();
//     });

//     test('should return empty array when no categories exist', async () => {
//       // Arrange - Set up empty result
//       mockCategoryModel.find.mockResolvedValue([]);

//       // Act - Call the controller function
//       await categoryController(mockReq, mockRes);

//       // Assert - Verify handling of empty result (test functionality, not exact messages)
//       expect(mockCategoryModel.find).toHaveBeenCalledWith({});
//       expect(mockRes.status).toHaveBeenCalledWith(200);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(true);
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);
//       expect(sendCall.category).toEqual([]);
//     });
//   });

//   describe('singleCategoryController Test Suite', () => {
//     test('should return single category successfully', async () => {
//       // Arrange - Set up mock data and behavior
//       const mockCategory = { _id: '1', name: 'Electronics', slug: 'electronics' };
//       const slug = 'electronics';
//       mockReq.params.slug = slug;
//       mockCategoryModel.findOne.mockResolvedValue(mockCategory);

//       // Act - Call the controller function
//       await singleCategoryController(mockReq, mockRes);

//       // Assert - Verify correct behavior (test functionality, not exact messages)
//       expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
//       expect(mockRes.status).toHaveBeenCalledWith(200);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(true);
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);
//       expect(sendCall.category).toEqual(mockCategory);
//     });

//     test('should handle database errors', async () => {
//       // Arrange - Set up mock error
//       const mockError = new Error('Database query failed');
//       const slug = 'electronics';
//       mockReq.params.slug = slug;
//       mockCategoryModel.findOne.mockRejectedValue(mockError);
//       const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

//       // Act - Call the controller function
//       await singleCategoryController(mockReq, mockRes);

//       // Assert - Verify error handling (test functionality, not exact messages)
//       expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
//       expect(consoleSpy).toHaveBeenCalledWith(mockError);
//       expect(mockRes.status).toHaveBeenCalledWith(500);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(false);
//       expect(sendCall.error).toBeDefined();
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);

//       consoleSpy.mockRestore();
//     });

//     test('should handle category not found scenario', async () => {
//       // Arrange - Set up null result (category not found)
//       const slug = 'nonexistent';
//       mockReq.params.slug = slug;
//       mockCategoryModel.findOne.mockResolvedValue(null);

//       // Act - Call the controller function
//       await singleCategoryController(mockReq, mockRes);

//       // Assert - Verify handling of not found (test functionality, not exact messages)
//       expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
//       expect(mockRes.status).toHaveBeenCalledWith(200);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(true);
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);
//       expect(sendCall.category).toBeNull();
//     });

//     test('should handle missing slug parameter', async () => {
//       // Arrange - Set up request without slug parameter
//       mockReq.params = {}; // No slug parameter
//       mockCategoryModel.findOne.mockResolvedValue(null);

//       // Act - Call the controller function
//       await singleCategoryController(mockReq, mockRes);

//       // Assert - Verify handling of missing parameter (test functionality, not exact messages)
//       expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: undefined });
//       expect(mockRes.status).toHaveBeenCalledWith(200);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(true);
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);
//       expect(sendCall.category).toBeNull();
//     });

//     test('should handle special characters in slug parameter', async () => {
//       // Arrange - Set up slug with special characters
//       const slug = 'electronics-&-gadgets';
//       mockReq.params.slug = slug;
//       const mockCategory = { _id: '1', name: 'Electronics & Gadgets', slug: slug };
//       mockCategoryModel.findOne.mockResolvedValue(mockCategory);

//       // Act - Call the controller function
//       await singleCategoryController(mockReq, mockRes);

//       // Assert - Verify handling of special characters (test functionality, not exact messages)
//       expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
//       expect(mockRes.status).toHaveBeenCalledWith(200);
      
//       const sendCall = mockRes.send.mock.calls[0][0];
//       expect(sendCall.success).toBe(true);
//       expect(typeof sendCall.message).toBe('string');
//       expect(sendCall.message.length).toBeGreaterThan(0);
//       expect(sendCall.category).toEqual(mockCategory);
//     });
//   });
// });