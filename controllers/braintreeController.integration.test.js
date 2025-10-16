import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import JWT from "jsonwebtoken";

import app from "../server.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

describe("braintreeController integration tests", () => {
    let buyerToken;
    let buyerUser;
    let testCategory;
    let testProducts = [];

    beforeAll(async () => {
        // Create test buyer user
        buyerUser = await userModel.create({
            name: "Buyer Test User",
            email: "buyer@test.com",
            password: "hashedpassword123",
            phone: "1234567890",
            address: { street: "123 Buyer St", city: "Buyer City" },
            answer: "test answer",
            role: 0, // Regular user role (buyer)
        });

        buyerToken = JWT.sign({ _id: buyerUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // Create test category
        testCategory = await categoryModel.create({
            name: "Test Payment Category",
            slug: "test-payment-category",
        });

        // Create test products with specific prices
        const photoBuffer = Buffer.from([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        ]);

        testProducts.push(
            await productModel.create({
                name: "Product One",
                slug: "product-one",
                description: "First test product",
                price: 100,
                category: testCategory._id,
                quantity: 10,
                photo: {
                    data: photoBuffer,
                    contentType: "image/jpeg"
                }
            })
        );

        testProducts.push(
            await productModel.create({
                name: "Product Two",
                slug: "product-two",
                description: "Second test product",
                price: 200,
                category: testCategory._id,
                quantity: 10,
                photo: {
                    data: photoBuffer,
                    contentType: "image/jpeg"
                }
            })
        );

        testProducts.push(
            await productModel.create({
                name: "Product Three",
                slug: "product-three",
                description: "Third test product",
                price: 300,
                category: testCategory._id,
                quantity: 10,
                photo: {
                    data: photoBuffer,
                    contentType: "image/jpeg"
                }
            })
        );
    });

    afterAll(async () => {
        await orderModel.deleteMany({});
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});
        await userModel.deleteMany({});
    });

    beforeEach(async () => {
        await orderModel.deleteMany({});
    });

    const createCart = (products) => products.map(p => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        quantity: p.quantity
    }));

    describe("GET /api/v1/product/braintree/token", () => {
        describe("successful token generation", () => {
            it("should return client token from Braintree", async () => {
                // Act
                const response = await request(app)
                    .get("/api/v1/product/braintree/token");

                // Assert
                expect(response.status).toBe(200);
                expect(response.body).toBeDefined();
                expect(response.body.clientToken).toBeDefined();
                expect(typeof response.body.clientToken).toBe("string");
                expect(response.body.clientToken.length).toBeGreaterThan(0);
            });
        });
    });

    describe("POST /api/v1/product/braintree/payment", () => {
        describe("validation failures", () => {
            it("should return 400 when nonce is missing", async () => {
                // Arrange
                const cart = createCart([testProducts[0]]);

                // Act
                const response = await request(app)
                    .post("/api/v1/product/braintree/payment")
                    .set("Authorization", buyerToken)
                    .send({ cart });

                // Assert
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Payment nonce is required");
            });

            it("should return 400 when cart is missing", async () => {
                // Act
                const response = await request(app)
                    .post("/api/v1/product/braintree/payment")
                    .set("Authorization", buyerToken)
                    .send({ nonce: "fake-valid-nonce" });

                // Assert
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Shopping cart is required");
            });

            it("should return 400 when cart is empty array", async () => {
                // Act
                const response = await request(app)
                    .post("/api/v1/product/braintree/payment")
                    .set("Authorization", buyerToken)
                    .send({ 
                        nonce: "fake-valid-nonce",
                        cart: []
                    });

                // Assert
                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toBe("Shopping cart cannot be empty");
            });

            it("should return 401 when no authentication token is provided", async () => {
                // Arrange
                const cart = createCart([testProducts[0]]);

                // Act
                const response = await request(app)
                    .post("/api/v1/product/braintree/payment")
                    .send({ 
                        nonce: "fake-valid-nonce",
                        cart
                    });

                // Assert
                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("successful payments", () => {
            it("should process payment for single product and create order in database", async () => {
                // Arrange
                const cart = createCart([testProducts[0]]);

                // Act
                const response = await request(app)
                    .post("/api/v1/product/braintree/payment")
                    .set("Authorization", buyerToken)
                    .send({ 
                        nonce: "fake-valid-nonce",
                        cart
                    });

                // Assert response
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Payment done");

                // Verify order was created in database
                const orders = await orderModel.find({ buyer: buyerUser._id });
                expect(orders).toHaveLength(1);

                const order = orders[0];
                
                // Verify order contains correct product
                expect(order.products).toHaveLength(1);
                expect(order.products[0].toString()).toBe(testProducts[0]._id.toString());

                // Verify order has correct buyer
                expect(order.buyer.toString()).toBe(buyerUser._id.toString());

                // Verify payment result exists
                expect(order.payment).toBeDefined();
                expect(order.payment.transaction).toBeDefined();

                // Verify default status
                expect(order.status).toBe("Not Process");

                // Verify timestamps
                expect(order.createdAt).toBeDefined();
                expect(order.updatedAt).toBeDefined();
            });

            it("should process payment for multiple products and calculate correct total", async () => {
                // Arrange - Cart with 3 products (prices: 100, 200, 300 = total 600)
                const cart = createCart(testProducts);

                // Act
                const response = await request(app)
                    .post("/api/v1/product/braintree/payment")
                    .set("Authorization", buyerToken)
                    .send({ 
                        nonce: "fake-valid-nonce",
                        cart
                    });

                // Assert response
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Payment done");

                // Verify order was created in database
                const orders = await orderModel.find({ buyer: buyerUser._id });
                expect(orders).toHaveLength(1);

                const order = orders[0];
                
                // Verify order contains all 3 products
                expect(order.products).toHaveLength(3);
                expect(order.products[0].toString()).toBe(testProducts[0]._id.toString());
                expect(order.products[1].toString()).toBe(testProducts[1]._id.toString());
                expect(order.products[2].toString()).toBe(testProducts[2]._id.toString());

                // Verify order has correct buyer
                expect(order.buyer.toString()).toBe(buyerUser._id.toString());

                // Verify payment result exists and amount is correct
                expect(order.payment).toBeDefined();
                expect(order.payment.transaction).toBeDefined();
                expect(order.payment.transaction.amount).toBe("600.00");

                // Verify default status
                expect(order.status).toBe("Not Process");

                // Verify timestamps
                expect(order.createdAt).toBeDefined();
                expect(order.updatedAt).toBeDefined();
                expect(order.createdAt).toBeInstanceOf(Date);
                expect(order.updatedAt).toBeInstanceOf(Date);
            });
        });
    });
});

