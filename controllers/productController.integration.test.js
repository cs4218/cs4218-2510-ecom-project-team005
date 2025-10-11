import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import JWT from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

import app from "../server.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const createTestPhoto = (filename = "test-photo.jpg") => {
    const photoPath = path.join(__dirname, filename);
    // Create a small test image buffer (1x1 pixel JPEG)
    const testImageBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    ]);
    fs.writeFileSync(photoPath, testImageBuffer);
    return photoPath;
};

const createTestTextFile = (filename = "test-file.txt", content = "This is not an image") => {
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
};

const deleteTestFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const createProductInDb = async (productData, category) => {
    const photoBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    ]);

    const product = await productModel.create({
        name: productData.name || "Test Product",
        slug: productData.slug || "test-product",
        description: productData.description || "Test description",
        price: productData.price || 100,
        category: category._id,
        quantity: productData.quantity || 10,
        photo: {
            data: photoBuffer,
            contentType: "image/jpeg"
        }
    });

    return product;
};

describe("productController integration tests", () => {
    let adminToken;
    let adminUser;
    let testCategory;
    let testPhotoPath;

    beforeAll(async () => {
        testPhotoPath = createTestPhoto();

        adminUser = await userModel.create({
            name: "Admin Test User",
            email: "admin@test.com",
            password: "hashedpassword123",
            phone: "1234567890",
            address: { street: "123 Test St", city: "Test City" },
            answer: "test answer",
            role: 1, // Admin role
        });

        adminToken = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        testCategory = await categoryModel.create({
            name: "Test Category",
            slug: "test-category",
        });
    });

    afterAll(async () => {
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});
        await userModel.deleteMany({});

        deleteTestFile(testPhotoPath);
    });

    beforeEach(async () => {
        await productModel.deleteMany({});
    });

    describe("POST /api/v1/product/create-product", () => {
        describe("validation failures", () => {
            // Testing Strategy: Decision table for validation cases
            // [name, description, price, category, quantity, hasPhoto, expectedStatus, expectedError]
            const validationTestMatrix = [
                [null, "Test Description", "100", "category", "10", true, 500, "Name is required"],
                ["Test Product", null, "100", "category", "10", true, 500, "Description is required"],
                ["Test Product", "Test Description", null, "category", "10", true, 500, "Price is required"],
                ["Test Product", "Test Description", "100", null, "10", true, 500, "Category is required"],
                ["Test Product", "Test Description", "100", "category", null, true, 500, "Quantity is required"],
                ["Test Product", "Test Description", "100", "category", "10", false, 500, "Photo is required and must be less than 1MB"],
            ];

            it.each(validationTestMatrix)(
                "validation test case %#: should return error when field is missing",
                async (name, description, price, category, quantity, hasPhoto, expectedStatus, expectedError) => {
                    let req = request(app)
                        .post("/api/v1/product/create-product")
                        .set("Authorization", adminToken);

                    if (name !== null) req = req.field("name", name);
                    if (description !== null) req = req.field("description", description);
                    if (price !== null) req = req.field("price", price);
                    if (category !== null) req = req.field("category", testCategory._id.toString());
                    if (quantity !== null) req = req.field("quantity", quantity);
                    if (hasPhoto) req = req.attach("photo", testPhotoPath);

                    const response = await req;

                    expect(response.status).toBe(expectedStatus);
                    expect(response.body.error).toBe(expectedError);
                }
            );

            it("should return 400 when photo is not an image type", async () => {
                const textFilePath = createTestTextFile();

                const response = await request(app)
                    .post("/api/v1/product/create-product")
                    .set("Authorization", adminToken)
                    .field("name", "Test Product")
                    .field("description", "Test Description")
                    .field("price", "100")
                    .field("category", testCategory._id.toString())
                    .field("quantity", "10")
                    .attach("photo", textFilePath);

                expect(response.status).toBe(400);
                expect(response.body.error).toBe("Only image files are allowed");

                deleteTestFile(textFilePath);
            });

            it("should return 401 when no authorization token is provided", async () => {
                const response = await request(app)
                    .post("/api/v1/product/create-product")
                    .field("name", "Test Product")
                    .field("description", "Test Description")
                    .field("price", "100")
                    .field("category", testCategory._id.toString())
                    .field("quantity", "10")
                    .attach("photo", testPhotoPath);

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });

            it("should return 401 when non-admin user tries to create product", async () => {
                const regularUser = await userModel.create({
                    name: "Regular User",
                    email: "user@test.com",
                    password: "hashedpassword123",
                    phone: "9876543210",
                    address: { street: "456 User St", city: "User City" },
                    answer: "user answer",
                    role: 0, // Regular user role
                });

                const userToken = JWT.sign({ _id: regularUser._id }, process.env.JWT_SECRET, {
                    expiresIn: "7d",
                });

                const response = await request(app)
                    .post("/api/v1/product/create-product")
                    .set("Authorization", userToken)
                    .field("name", "Test Product")
                    .field("description", "Test Description")
                    .field("price", "100")
                    .field("category", testCategory._id.toString())
                    .field("quantity", "10")
                    .attach("photo", testPhotoPath);

                expect(response.status).toBe(401);
                expect(response.body.success).toBe(false);
            });
        });

        describe("successful product creation", () => {
            it("should create product with all valid fields and verify database", async () => {
                //arrange
                const input = {
                    name: "Integration Test Product",
                    description: "This is a test product description",
                    price: 199,
                    quantity: 25,
                    slug: "Integration-Test-Product",
                    category: testCategory,
                };

                // Act
                const response = await request(app)
                    .post("/api/v1/product/create-product")
                    .set("Authorization", adminToken)
                    .field("name", input.name)
                    .field("description", input.description)
                    .field("price", input.price.toString())
                    .field("category", input.category._id.toString())
                    .field("quantity", input.quantity.toString())
                    .attach("photo", testPhotoPath);

                // Assert basic response structure
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("Product created successfully");
                expect(response.body.products).toBeDefined();

                // Assert the received product matches the input
                expect(response.body.products).toMatchObject({
                    name: input.name,
                    description: input.description,
                    price: input.price,
                    quantity: input.quantity,
                    slug: input.slug,
                });

                // Assert product exists in database and matches input
                const productInDb = await productModel.findOne({
                    name: input.name
                }).populate("category");


                expect(productInDb.toObject()).toEqual(
                    expect.objectContaining({
                        name: input.name,
                        description: input.description,
                        price: input.price,
                        quantity: input.quantity,
                        slug: input.slug,
                        category: expect.objectContaining({
                            _id: testCategory._id,
                            name: testCategory.name
                        }),
                    })
                );

                // Assert photo was stored
                expect(productInDb.photo.data).toBeInstanceOf(Buffer);
                expect(productInDb.photo.data.length).toBeGreaterThan(0);
                expect(productInDb.photo.contentType).toBe("image/jpeg");

                // Assert timestamps
                expect(productInDb.createdAt).toBeDefined();
                expect(productInDb.updatedAt).toBeDefined();
            });
        });
    });

    describe("GET /api/v1/product/get-product", () => {
        describe("successful product retrieval", () => {
            it("should return 2 products stored in DB and not include photo data", async () => {
                // Arrange: Create 2 products in the database using helper
                const product1 = await createProductInDb({
                    name: "Product One",
                    slug: "product-one",
                    description: "First product description",
                    price: 150,
                    quantity: 5
                }, testCategory);

                const product2 = await createProductInDb({
                    name: "Product Two",
                    slug: "product-two",
                    description: "Second product description",
                    price: 250,
                    quantity: 15
                }, testCategory);

                // Act
                const response = await request(app)
                    .get("/api/v1/product/get-product");

                // Assert response structure
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe("All Products ");
                expect(response.body.countTotal).toBe(2);
                expect(response.body.products).toHaveLength(2);

                // Assert products are returned in correct order (newest first)
                expect(response.body.products[0].name).toBe("Product Two");
                expect(response.body.products[1].name).toBe("Product One");

                // Assert photo field is not included in response
                expect(response.body.products[0].photo).toBeUndefined();
                expect(response.body.products[1].photo).toBeUndefined();

                // Assert other fields are present
                expect(response.body.products[0]).toMatchObject({
                    name: "Product Two",
                    slug: "product-two",
                    description: "Second product description",
                    price: 250,
                    quantity: 15
                });
                expect(response.body.products[1]).toMatchObject({
                    name: "Product One",
                    slug: "product-one",
                    description: "First product description",
                    price: 150,
                    quantity: 5
                });

                // Assert category is populated
                expect(response.body.products[0].category.name).toBe("Test Category");
                expect(response.body.products[1].category.name).toBe("Test Category");
            });

            it("should return maximum 12 products when DB contains 13 products (limit test)", async () => {
                // Arrange: Create 13 products in the database
                for (let i = 1; i <= 13; i++) {
                    await createProductInDb({
                        name: `Product ${i}`,
                        slug: `product-${i}`,
                        description: `Description for product ${i}`,
                        price: 100 + i,
                        quantity: i
                    }, testCategory);
                }

                // Act
                const response = await request(app)
                    .get("/api/v1/product/get-product");

                // Assert: Only 12 products returned due to limit
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.countTotal).toBe(12);
                expect(response.body.products).toHaveLength(12);

                // Assert photo is not included in any product
                response.body.products.forEach(product => {
                    expect(product.photo).toBeUndefined();
                });
            });
        });
    });

    describe("GET /api/v1/product/get-product/:slug", () => {
        it("should return single product by slug", async () => {
            // Arrange
            const product = await createProductInDb({
                name: "Single Product Test",
                slug: "single-product-test",
                description: "Test description",
                price: 100,
                quantity: 5
            }, testCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/get-product/${product.slug}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.product.name).toBe("Single Product Test");
            expect(response.body.product.photo).toBeUndefined();
        });
    });

    describe("GET /api/v1/product/product-photo/:pid", () => {
        it("should return product photo", async () => {
            // Arrange
            const product = await createProductInDb({
                name: "Photo Test Product",
                slug: "photo-test-product"
            }, testCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-photo/${product._id}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toBe("image/jpeg");
        });

        it("should return 404 when product not found", async () => {
            // Arrange
            const fakeId = new mongoose.Types.ObjectId();

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-photo/${fakeId}`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/product/product-filters", () => {
        it("should filter products by category and price range", async () => {
            // Arrange
            await createProductInDb({
                name: "Cheap Product",
                slug: "cheap-product",
                price: 50
            }, testCategory);
            await createProductInDb({
                name: "Expensive Product",
                slug: "expensive-product",
                price: 500
            }, testCategory);

            // Act
            const response = await request(app)
                .post("/api/v1/product/product-filters")
                .send({
                    checked: [testCategory._id],
                    radio: [0, 100]
                });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].name).toBe("Cheap Product");
        });
    });

    describe("GET /api/v1/product/product-count", () => {
        it("should return total product count", async () => {
            // Arrange
            await createProductInDb({ name: "Product 1", slug: "product-1" }, testCategory);
            await createProductInDb({ name: "Product 2", slug: "product-2" }, testCategory);

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-count");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.total).toBe(2);
        });
    });

    describe("GET /api/v1/product/product-list/:page", () => {
        it("should return paginated products", async () => {
            // Arrange
            for (let i = 1; i <= 8; i++) {
                await createProductInDb({
                    name: `Product ${i}`,
                    slug: `product-${i}`
                }, testCategory);
            }

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-list/1");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(6);
        });
    });

    describe("GET /api/v1/product/search/:keyword", () => {
        it("should search products by keyword", async () => {
            // Arrange
            await createProductInDb({
                name: "Laptop Computer",
                slug: "laptop-computer",
                description: "Gaming laptop"
            }, testCategory);
            await createProductInDb({
                name: "Mobile Phone",
                slug: "mobile-phone"
            }, testCategory);

            // Act
            const response = await request(app)
                .get("/api/v1/product/search/laptop");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe("Laptop Computer");
        });
    });

    describe("GET /api/v1/product/related-product/:pid/:cid", () => {
        it("should return related products from same category", async () => {
            // Arrange
            const product1 = await createProductInDb({
                name: "Product 1",
                slug: "product-1"
            }, testCategory);
            await createProductInDb({
                name: "Product 2",
                slug: "product-2"
            }, testCategory);
            await createProductInDb({
                name: "Product 3",
                slug: "product-3"
            }, testCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/related-product/${product1._id}/${testCategory._id}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(2);
            expect(response.body.products.every(p => p._id !== product1._id.toString())).toBe(true);
        });
    });

    describe("GET /api/v1/product/product-category/:slug/:page", () => {
        it("should return products by category with pagination", async () => {
            // Arrange
            const category2 = await categoryModel.create({
                name: "Category 2",
                slug: "category-2"
            });
            await createProductInDb({ name: "Cat1 Product", slug: "cat1-product" }, testCategory);
            await createProductInDb({ name: "Cat2 Product", slug: "cat2-product" }, category2);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category/${testCategory.slug}/1`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(1);
            expect(response.body.category.name).toBe("Test Category");
        });
    });

    describe("GET /api/v1/product/product-category-count/:slug", () => {
        it("should return count of products in category", async () => {
            // Arrange
            await createProductInDb({ name: "Product 1", slug: "product-1" }, testCategory);
            await createProductInDb({ name: "Product 2", slug: "product-2" }, testCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category-count/${testCategory.slug}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.total).toBe(2);
        });
    });

    describe("GET /api/v1/product/braintree/token", () => {
        it("should return braintree client token", async () => {
            // Act
            const response = await request(app)
                .get("/api/v1/product/braintree/token");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.clientToken).toBeDefined();
        });
    });

    describe("POST /api/v1/product/braintree/payment", () => {
        it("should return 400 when nonce is missing", async () => {
            // Act
            const response = await request(app)
                .post("/api/v1/product/braintree/payment")
                .set("Authorization", adminToken)
                .send({
                    cart: [{ _id: "123", price: 100 }]
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Payment nonce is required");
        });

        it("should return 400 when cart is missing", async () => {
            // Act
            const response = await request(app)
                .post("/api/v1/product/braintree/payment")
                .set("Authorization", adminToken)
                .send({
                    nonce: "fake-nonce"
                });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Shopping cart is required");
        });
    });
});
