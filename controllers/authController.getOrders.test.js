// controllers/authController.getOrders.test.js
import { getOrdersController } from "./authController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

const mockRes = () => {
  const res = {};
  res.json = jest.fn();
  res.status = jest.fn().mockReturnThis();
  res.send = jest.fn();
  return res;
};

describe("getOrdersController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should get orders for current user", async () => {
    const req = { user: { _id: "user123" } };
    const res = mockRes();

    // karena di controller kamu pakai chaining .populate(...).populate(...)
    // kita perlu mock-nya sebagai objek yang punya method itu
    const mockPopulate2 = { populate: jest.fn().mockResolvedValue([{ _id: "o1" }]) };
    const mockPopulate1 = { populate: jest.fn(() => mockPopulate2) };

    orderModel.find.mockReturnValue(mockPopulate1);

    await getOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
    expect(mockPopulate1.populate).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulate2.populate).toHaveBeenCalledWith("buyer", "name");
    expect(res.json).toHaveBeenCalledWith([{ _id: "o1" }]);
  });

  test("should handle errors", async () => {
    const req = { user: { _id: "user123" } };
    const res = mockRes();

    orderModel.find.mockImplementation(() => {
      throw new Error("DB fail");
    });

    await getOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error WHile Geting Orders",
      })
    );
  });
});
