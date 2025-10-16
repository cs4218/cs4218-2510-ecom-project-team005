import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals";
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
import orderModel from "../models/orderModel.js";

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
                expect(response.body.message).toBe("All Products");
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
            });
            it("should return empty array when there are no products", async () => {
                // Act
                const response = await request(app)
                    .get("/api/v1/product/get-product");

                // Assert: Only 12 products returned due to limit
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.countTotal).toBe(0);
                expect(response.body.products).toHaveLength(0);
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
            expect(response.body.message).toBe("Single product fetched")
        });
        it("should handle product not in db", async () => {
            // Act
            const response = await request(app)
                .get(`/api/v1/product/get-product/unkown-slug`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.product).toBe(null);
            expect(response.body.message).toBe("No product found with this slug")
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

        it("should filter products by price range only", async () => {
            // Arrange - Create 2 products with different prices
            await createProductInDb({
                name: "Affordable Product",
                slug: "affordable-product",
                price: 75
            }, testCategory);
            await createProductInDb({
                name: "Premium Product",
                slug: "premium-product",
                price: 300
            }, testCategory);

            // Act - Filter by price range [0, 100] without category filter
            const response = await request(app)
                .post("/api/v1/product/product-filters")
                .send({
                    checked: [],
                    radio: [0, 100]
                });

            // Assert - Only the affordable product should be returned
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].name).toBe("Affordable Product");
            expect(response.body.products[0].price).toBe(75);
        });

        it("should filter products by category only", async () => {
            // Arrange - Create a second category
            const category2 = await categoryModel.create({
                name: "Electronics",
                slug: "electronics"
            });

            // Create one product in each category
            await createProductInDb({
                name: "Furniture Item",
                slug: "furniture-item",
                price: 150
            }, testCategory);
            await createProductInDb({
                name: "Electronics Item",
                slug: "electronics-item",
                price: 200
            }, category2);

            // Act - Filter by testCategory only without price filter
            const response = await request(app)
                .post("/api/v1/product/product-filters")
                .send({
                    checked: [testCategory._id],
                    radio: []
                });

            // Assert - Only the furniture product should be returned
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(1);
            expect(response.body.products[0].name).toBe("Furniture Item");
            expect(response.body.products[0].category.toString()).toBe(testCategory._id.toString());
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

    describe("GET /product-category-count/:slug", () => {
        it("should return total product count", async () => {
            // Arrange
            await createProductInDb({ name: "Product 1", slug: "product-1" }, testCategory);
            await createProductInDb({ name: "Product 2", slug: "product-2" }, testCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category-count/test-category`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.total).toBe(2);
        });
        it("should return 404 for non-existant category", async () => {
       
            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category-count/test-non-existant`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("There is no category with the requested slug");
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/product/product-list/:page", () => {
        beforeEach(async () => {
            await productModel.deleteMany({});
        });

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

        it("should return page 2 with correct products", async () => {
            // Arrange - Create 13 products
            for (let i = 1; i <= 13; i++) {
                await createProductInDb({
                    name: `Product ${i}`,
                    slug: `product-${i}`
                }, testCategory);
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-list/2");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(6);
            
            // Verify products are sorted by createdAt descending (newest first)
            // Products 7-12 should be returned (13-12-11-10-9-8 by creation order)
            expect(response.body.products[0].name).toBe("Product 7");
            expect(response.body.products[5].name).toBe("Product 2");
        });

        it("should return last page with partial results", async () => {
            // Arrange - Create 10 products
            for (let i = 1; i <= 10; i++) {
                await createProductInDb({
                    name: `Product ${i}`,
                    slug: `product-${i}`
                }, testCategory);
            }

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-list/2");

            // Assert - Page 2 should have 4 remaining products
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(4);
        });

        it("should return empty array for page beyond available data", async () => {
            // Arrange - Create only 5 products (less than one page)
            for (let i = 1; i <= 5; i++) {
                await createProductInDb({
                    name: `Product ${i}`,
                    slug: `product-${i}`
                }, testCategory);
            }

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-list/2");

            // Assert - Page 2 should be empty
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(0);
        });

        it("should default to page 1 when page 0 is requested", async () => {
            // Arrange - Create 8 products
            for (let i = 1; i <= 8; i++) {
                await createProductInDb({
                    name: `Product ${i}`,
                    slug: `product-${i}`
                }, testCategory);
            }

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-list/0");

            // Assert - Should return first 6 products (same as page 1)
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(6);
        });

        it("should return empty array when database has no products", async () => {
            // Arrange - No products in database (beforeEach clears them)

            // Act
            const response = await request(app)
                .get("/api/v1/product/product-list/1");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(0);
        });
    });

    describe("GET /api/v1/product/search/:keyword", () => {
        it("should search products by name", async () => {
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
        it("should search products by description", async () => {
            // Arrange
            await createProductInDb({
                name: "Laptop Computer",
                slug: "laptop-computer",
                description: "Apple"
            }, testCategory);
            await createProductInDb({
                name: "Mobile Phone",
                slug: "mobile-phone",
                description: "Windows"
            }, testCategory);

            // Act
            const response = await request(app)
                .get("/api/v1/product/search/Windows");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe("Mobile Phone");
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

        it("should return maximum of 3 related products even when more exist", async () => {
            // Arrange - Create 6 products in the same category
            const product1 = await createProductInDb({
                name: "Product 1",
                slug: "product-1"
            }, testCategory);
            
            for (let i = 2; i <= 6; i++) {
                await createProductInDb({
                    name: `Product ${i}`,
                    slug: `product-${i}`
                }, testCategory);
            }

            // Act
            const response = await request(app)
                .get(`/api/v1/product/related-product/${product1._id}/${testCategory._id}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(3); // Limit is 3, not 5
            
            // Verify the requested product is excluded
            expect(response.body.products.every(p => p._id !== product1._id.toString())).toBe(true);
            
            // Verify all products are from the same category
            expect(response.body.products.every(p => p.category._id.toString() === testCategory._id.toString())).toBe(true);
            
            // Verify photo field is excluded
            expect(response.body.products[0].photo).toBeUndefined();
            expect(response.body.products[1].photo).toBeUndefined();
            expect(response.body.products[2].photo).toBeUndefined();
        });

        it("should return empty array when only one product exists in category", async () => {
            // Arrange - Create only 1 product in the category
            const singleProduct = await createProductInDb({
                name: "Only Product",
                slug: "only-product"
            }, testCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/related-product/${singleProduct._id}/${testCategory._id}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(0); // No other products available
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

        it("should return 404 for non-existent category", async () => {
            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category/non-existent-category/1`);

            // Assert
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Category not found");
        });

        it("should return empty array for category with no products", async () => {
            // Arrange
            const emptyCategory = await categoryModel.create({
                name: "Empty Category",
                slug: "empty-category"
            });

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category/${emptyCategory.slug}/1`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(0);
            expect(response.body.category.name).toBe("Empty Category");
        });

        it("should handle pagination across multiple pages correctly", async () => {
            // Arrange - Create 15 products (3 pages with perPage=6)
            const paginationCategory = await categoryModel.create({
                name: "Pagination Category",
                slug: "pagination-category"
            });
            
            const productPromises = [];
            for (let i = 1; i <= 15; i++) {
                productPromises.push(
                    createProductInDb({
                        name: `Pagination Product ${i}`,
                        slug: `pagination-product-${i}`,
                        price: 100 + i
                    }, paginationCategory)
                );
            }
            await Promise.all(productPromises);

            // Act & Assert - Page 1
            const page1Response = await request(app)
                .get(`/api/v1/product/product-category/${paginationCategory.slug}/1`);
            expect(page1Response.status).toBe(200);
            expect(page1Response.body.success).toBe(true);
            expect(page1Response.body.products).toHaveLength(6);

            // Act & Assert - Page 2
            const page2Response = await request(app)
                .get(`/api/v1/product/product-category/${paginationCategory.slug}/2`);
            expect(page2Response.status).toBe(200);
            expect(page2Response.body.success).toBe(true);
            expect(page2Response.body.products).toHaveLength(6);

            // Act & Assert - Page 3
            const page3Response = await request(app)
                .get(`/api/v1/product/product-category/${paginationCategory.slug}/3`);
            expect(page3Response.status).toBe(200);
            expect(page3Response.body.success).toBe(true);
            expect(page3Response.body.products).toHaveLength(3);
        });

        it("should return products sorted by createdAt in descending order", async () => {
            // Arrange
            const sortCategory = await categoryModel.create({
                name: "Sort Category",
                slug: "sort-category"
            });

            // Create products with slight delays to ensure different timestamps
            const product1 = await createProductInDb({
                name: "First Product",
                slug: "first-product",
                price: 100
            }, sortCategory);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const product2 = await createProductInDb({
                name: "Second Product",
                slug: "second-product",
                price: 200
            }, sortCategory);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const product3 = await createProductInDb({
                name: "Third Product",
                slug: "third-product",
                price: 300
            }, sortCategory);

            // Act
            const response = await request(app)
                .get(`/api/v1/product/product-category/${sortCategory.slug}/1`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(3);
            // Newest product should be first
            expect(response.body.products[0].name).toBe("Third Product");
            expect(response.body.products[1].name).toBe("Second Product");
            expect(response.body.products[2].name).toBe("First Product");
        });

        it("should return empty array when requesting page beyond available data", async () => {
            // Arrange - Create 8 products (2 pages)
            const beyondCategory = await categoryModel.create({
                name: "Beyond Category",
                slug: "beyond-category"
            });

            const productPromises = [];
            for (let i = 1; i <= 8; i++) {
                productPromises.push(
                    createProductInDb({
                        name: `Beyond Product ${i}`,
                        slug: `beyond-product-${i}`
                    }, beyondCategory)
                );
            }
            await Promise.all(productPromises);

            // Act - Request page 10 (way beyond available data)
            const response = await request(app)
                .get(`/api/v1/product/product-category/${beyondCategory.slug}/10`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(0);
            expect(response.body.category.name).toBe("Beyond Category");
        });

        it("should return correct number of products on last page with partial items", async () => {
            // Arrange - Create 8 products (page 1: 6 items, page 2: 2 items)
            const partialCategory = await categoryModel.create({
                name: "Partial Category",
                slug: "partial-category"
            });

            const productPromises = [];
            for (let i = 1; i <= 8; i++) {
                productPromises.push(
                    createProductInDb({
                        name: `Partial Product ${i}`,
                        slug: `partial-product-${i}`
                    }, partialCategory)
                );
            }
            await Promise.all(productPromises);

            // Act - Request page 2 (should have only 2 items)
            const response = await request(app)
                .get(`/api/v1/product/product-category/${partialCategory.slug}/2`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.products).toHaveLength(2);
            expect(response.body.category.name).toBe("Partial Category");
        });
    });
});
