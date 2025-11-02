// tests/integration/orders.user.int.test.js
import request from "supertest";
import app from "../../app.js";
import orderModel from "../../models/orderModel.js";

// Matiin middleware auth beneran, ganti mock supaya req.user kebaca
jest.mock("../../middlewares/authMiddleware.js", () => ({
  requireSignIn: (req, _res, next) => {
    req.user = { _id: "user123", role: 0, name: "User 123" };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock("../../models/orderModel.js");

describe("GET /api/v1/auth/orders (user)", () => {
  it("should return orders for current user", async () => {
    // bikin mock chaining: find → populate → populate
    const mockPopulate2 = {
      populate: jest.fn().mockResolvedValue([
        {
          _id: "ord-1",
          status: "Not Process",
          buyer: { name: "User 123" },
          products: [{ _id: "p1", name: "Product 1" }],
        },
      ]),
    };
    const mockPopulate1 = {
      populate: jest.fn(() => mockPopulate2),
    };

    // ketika orderModel.find() dipanggil, dia balikin object yang bisa di-populate
    orderModel.find.mockReturnValue(mockPopulate1);

    const res = await request(app)
      .get("/api/v1/auth/orders")
      .expect(200);

    // pastikan query-nya bener
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: "user123" });
    // pastikan populate-nya kepanggil
    expect(mockPopulate1.populate).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulate2.populate).toHaveBeenCalledWith("buyer", "name");

    // pastikan responnya sesuai mock
    expect(res.body).toEqual([
      expect.objectContaining({
        _id: "ord-1",
        status: "Not Process",
      }),
    ]);
  });

  it("should handle error from db", async () => {
    orderModel.find.mockImplementation(() => {
      throw new Error("db error");
    });

    const res = await request(app)
      .get("/api/v1/auth/orders")
      .expect(500);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Error WHile Geting Orders",
      })
    );
  });
});
