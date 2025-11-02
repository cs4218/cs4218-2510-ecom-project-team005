// controllers/authController.orderStatus.test.js
import { orderStatusController } from "./authController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

const mockRes = () => {
  const res = {};
  res.json = jest.fn();
  res.status = jest.fn().mockReturnThis();
  res.send = jest.fn();
  return res;
};

describe("orderStatusController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should update order status", async () => {
    const req = {
      params: { orderId: "order123" },
      body: { status: "Shipped" },
    };
    const res = mockRes();

    orderModel.findByIdAndUpdate.mockResolvedValue({
      _id: "order123",
      status: "Shipped",
    });

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order123",
      { status: "Shipped" },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith({
      _id: "order123",
      status: "Shipped",
    });
  });

  test("should handle error", async () => {
    const req = {
      params: { orderId: "order123" },
      body: { status: "Shipped" },
    };
    const res = mockRes();

    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("db error"));

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While Updateing Order",
      })
    );
  });
});
