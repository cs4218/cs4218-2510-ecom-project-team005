import mongoose from "mongoose";
import Order from "./orderModel";

describe("Order Model", () => {
  test("should create a schema with correct fields", () => {
    const schemaObj = Order.schema.obj;

    // pastikan field ada
    expect(schemaObj).toHaveProperty("products");
    expect(schemaObj).toHaveProperty("payment");
    expect(schemaObj).toHaveProperty("buyer");
    expect(schemaObj).toHaveProperty("status");

    // cek tipe data
    expect(schemaObj.products[0].type).toBe(mongoose.ObjectId);
    expect(schemaObj.buyer.type).toBe(mongoose.ObjectId);

    // cek default value status
    expect(schemaObj.status.default).toBe("Not Process");

    // cek enum values
    expect(schemaObj.status.enum).toEqual([
      "Not Process",
      "Processing",
      "Shipped",
      "deliverd",
      "cancel",
    ]);
  });

  test("should create a new Order document correctly", () => {
    const mockOrder = new Order({
      products: [new mongoose.Types.ObjectId()],
      payment: { id: "pay123", amount: 500 },
      buyer: new mongoose.Types.ObjectId(),
      status: "Processing",
    });

    expect(mockOrder.products).toHaveLength(1);
    expect(mockOrder.payment).toEqual({ id: "pay123", amount: 500 });
    expect(mockOrder.status).toBe("Processing");
  });

  test("should set default status when not provided", () => {
    const mockOrder = new Order({});
    expect(mockOrder.status).toBe("Not Process");
  });
});
