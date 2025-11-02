// controllers/authController.getAllOrders.test.js
import { getAllOrdersController } from "./authController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

const mockRes = () => {
  const res = {};
  res.json = jest.fn();
  res.status = jest.fn().mockReturnThis();
  res.send = jest.fn();
  return res;
};

describe("getAllOrdersController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should get all orders sorted desc", async () => {
    const req = {};
    const res = mockRes();

    // mocking chain: find -> populate -> populate -> sort
    const mockSort = { sort: jest.fn().mockResolvedValue([{ _id: "o1" }, { _id: "o2" }]) };
    const mockPopulate2 = { populate: jest.fn(() => mockSort) };
    const mockPopulate1 = { populate: jest.fn(() => mockPopulate2) };

    orderModel.find.mockReturnValue(mockPopulate1);

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(mockPopulate1.populate).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulate2.populate).toHaveBeenCalledWith("buyer", "name");
    expect(mockSort.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.json).toHaveBeenCalledWith([{ _id: "o1" }, { _id: "o2" }]);
  });

  test("should handle error", async () => {
    const req = {};
    const res = mockRes();

    orderModel.find.mockImplementation(() => {
      throw new Error("DB fail");
    });

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error WHile Geting Orders",
      })
    );
  });
});
