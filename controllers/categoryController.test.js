// HOU QINGSHAN categoryController unit tests

import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from "./categoryController.js";

// mock
jest.mock("../models/categoryModel.js", () => {
  const ctor = jest.fn(); // used with `new categoryModel(...)`
  // static methods used directly on the model:
  ctor.findOne = jest.fn();
  ctor.find = jest.fn();
  ctor.findByIdAndUpdate = jest.fn();
  ctor.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: ctor };
});

jest.mock("slugify", () => ({
  __esModule: true,
  default: (str) =>
    String(str)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-"),
}));

import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

// helper to create mock res object with jest.fn() methods
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

beforeEach(() => {
  jest.clearAllMocks();
});



// Suite 1: createCategoryController
describe("createCategoryController", () => {
  test("401 when name is missing", async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    // no DB calls
    expect(categoryModel.findOne).not.toHaveBeenCalled();
  });

  test("200 when category already exists", async () => {
    const req = makeReq({ body: { name: "Phones" } });
    const res = makeRes();
    categoryModel.findOne.mockResolvedValue({ _id: "x1", name: "Phones" });

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Phones" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category Already Exisits",
    });
  });

  test("201 creates category when not existing", async () => {
    const req = makeReq({ body: { name: "New Item" } });
    const res = makeRes();

    categoryModel.findOne.mockResolvedValue(null);

    // mock constructor: new categoryModel({...}).save()
    const savedDoc = { _id: "id123", name: "New Item", slug: "new-item" };
    categoryModel.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(savedDoc),
    }));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "New Item" });
    expect(slugify("New Item")).toBe("new-item");
    // ensure ctor was called with the right payload
    expect(categoryModel).toHaveBeenCalledWith({
      name: "New Item",
      slug: "new-item",
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "new category created",
      category: savedDoc,
    });
  });

  test("500 when underlying logic throws => catch path", async () => {
    const req = makeReq({ body: { name: "Boom" } });
    const res = makeRes();
    const err = new Error("DB down");
    categoryModel.findOne.mockRejectedValue(err);

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    // check the payload sent, expect success:false and message contains "error"
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message.toLowerCase()).toContain("error");
  });
});

// Suite 2: updateCategoryController
describe("updateCategoryController", () => {
  test("200 updates and returns the category", async () => {
    const req = makeReq({
      params: { id: "abc123" },
      body: { name: "Laptops Pro" },
    });
    const res = makeRes();

    const updated = { _id: "abc123", name: "Laptops Pro", slug: "laptops-pro" };
    categoryModel.findByIdAndUpdate.mockResolvedValue(updated);

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "abc123",
      { name: "Laptops Pro", slug: "laptops-pro" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      messsage: "Category Updated Successfully",
      category: updated,
    });
  });

  test("500 when update throws", async () => {
    const req = makeReq({
      params: { id: "abc123" },
      body: { name: "Bad" },
    });
    const res = makeRes();

    categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("nope"));

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/updating category/i);
  });
});


// Suite 3: categoryController (get all categories)
describe("categoryController (get all categories)", () => {
  test("200 returns list", async () => {
    const req = makeReq();
    const res = makeRes();

    const docs = [{ name: "Phones" }, { name: "Laptops" }];
    categoryModel.find.mockResolvedValue(docs);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "All Categories List",
      category: docs,
    });
  });

  test("500 when find throws", async () => {
    const req = makeReq();
    const res = makeRes();
    categoryModel.find.mockRejectedValue(new Error("broken"));

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/getting all categories/i);
  });
});


// Suite 4: singleCategoryController
describe("singleCategoryController", () => {
  test("200 returns single by slug", async () => {
    const req = makeReq({ params: { slug: "phones" } });
    const res = makeRes();
    const doc = { _id: "1", name: "Phones", slug: "phones" };

    categoryModel.findOne.mockResolvedValue(doc);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "phones" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Get SIngle Category SUccessfully",
      category: doc,
    });
  });

  test("500 when findOne throws", async () => {
    const req = makeReq({ params: { slug: "x" } });
    const res = makeRes();
    categoryModel.findOne.mockRejectedValue(new Error("db"));

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/single category/i);
  });
});


// Suite 5: deleteCategoryController
describe("deleteCategoryController", () => {
  test("200 when deletion succeeds", async () => {
    const req = makeReq({ params: { id: "del123" } });
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockResolvedValue({}); // return value not used

    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("del123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Categry Deleted Successfully",
    });
  });

  test("500 when deletion throws", async () => {
    const req = makeReq({ params: { id: "del123" } });
    const res = makeRes();

    categoryModel.findByIdAndDelete.mockRejectedValue(new Error("perm"));

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.send.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toMatch(/deleting category/i);
  });
});