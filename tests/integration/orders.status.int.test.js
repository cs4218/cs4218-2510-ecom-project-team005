// tests/integration/orders.status.int.test.js
import request from "supertest";
import app from "../../app.js";
import orderModel from "../../models/orderModel.js";

jest.mock("../../middlewares/authMiddleware.js", () => ({
  requireSignIn: (req, _res, next) => {
    req.user = { _id: "admin123", role: 1 };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock("../../models/orderModel.js");

describe("PUT /api/v1/auth/order-status/:orderId", () => {
  it("should update order status and return updated order", async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue({
      _id: "order123",
      status: "Shipped",
    });

    const res = await request(app)
      .put("/api/v1/auth/order-status/order123")
      .send({ status: "Shipped" })
      .expect(200);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "order123",
      { status: "Shipped" },
      { new: true }
    );
    expect(res.body.status).toBe("Shipped");
  });

  it("should return 500 if db fails", async () => {
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error("db error"));

    const res = await request(app)
      .put("/api/v1/auth/order-status/order123")
      .send({ status: "cancel" })
      .expect(500);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Error While Updateing Order",
      })
    );
  });
});
