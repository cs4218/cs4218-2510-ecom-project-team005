// tests/integration/orders.admin.int.test.js
import request from "supertest";
import app from "../../app.js";
import orderModel from "../../models/orderModel.js";

jest.mock("../../middlewares/authMiddleware.js", () => ({
  requireSignIn: (req, _res, next) => {
    req.user = { _id: "admin123", role: 1, name: "Admin" };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
}));

jest.mock("../../models/orderModel.js");

describe("GET /api/v1/auth/all-orders (admin)", () => {
  it("should return all orders sorted by createdAt desc", async () => {
    const mockSort = {
      sort: jest.fn().mockResolvedValue([
        { _id: "o2", createdAt: "2024-10-02" },
        { _id: "o1", createdAt: "2024-10-01" },
      ]),
    };
    const mockPopulate2 = { populate: jest.fn(() => mockSort) };
    const mockPopulate1 = { populate: jest.fn(() => mockPopulate2) };

    orderModel.find.mockReturnValue(mockPopulate1);

    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .expect(200);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(mockPopulate1.populate).toHaveBeenCalledWith("products", "-photo");
    expect(mockPopulate2.populate).toHaveBeenCalledWith("buyer", "name");
    expect(mockSort.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.body).toHaveLength(2);
    expect(res.body[0]._id).toBe("o2");
  });

  it("should handle error", async () => {
    orderModel.find.mockImplementation(() => {
      throw new Error("db fail");
    });

    const res = await request(app)
      .get("/api/v1/auth/all-orders")
      .expect(500);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Error WHile Geting Orders",
      })
    );
  });
});
