/**
 * Integration Tests for updateProductController
 *
 * - HTTP PUT /api/v1/product/update-product/:pid integration with Express app
 * - Admin authentication middleware integration (requireSignIn + isAdmin)
 * - express-formidable middleware integration for multipart/form-data
 * - Price validation (must be >= 0)
 * - Quantity validation (must be >= 0)
 * - Category change triggers slug regeneration with slugify
 * - Photo null safety (initialize photo object if undefined)
 * - Product existence validation (404 if not found)
 * - Product model integration with MongoDB (findByIdAndUpdate)
 * - Real HTTP requests via supertest
 * - Real database operations (update, validation)
 *
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import JWT from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../server.js';
import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import userModel from '../models/userModel.js';

// ES module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('updateProductController Integration Test Suite', () => {
  let adminToken;
  let adminUser;
  let category1;
  let category2;
  let testProduct;
  let testImagePath;

  beforeEach(async () => {
    // Arrange - Clear all products, categories, and users before each test for isolation
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});

    // Arrange - Create admin user for authentication
    adminUser = await userModel.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      phone: '1234567890',
      address: { street: '123 Admin St' },
      answer: 'admin answer',
      role: 1 // Admin role
    });

    // Arrange - Generate JWT token for admin
    adminToken = JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Arrange - Create two categories for testing category changes
    category1 = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics'
    });

    category2 = await categoryModel.create({
      name: 'Books',
      slug: 'books'
    });

    // Arrange - Create test image file
    testImagePath = path.join(__dirname, 'test-update-image.jpg');
    const minimalJPEG = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
      0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
      0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
      0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
      0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
      0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
      0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
      0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
      0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14,
      0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
      0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
    ]);
    fs.writeFileSync(testImagePath, minimalJPEG);

    // Arrange - Create a test product to update
    testProduct = await productModel.create({
      name: 'Original Product Name',
      slug: 'Original-Product-Name',
      description: 'Original description',
      price: 100,
      category: category1._id,
      quantity: 10,
      photo: {
        data: minimalJPEG,
        contentType: 'image/jpeg'
      }
    });
  });

  afterEach(() => {
    // Cleanup - Remove test image file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  });

  describe('Successful Product Update Integration Tests', () => {
    test('should update product successfully with all valid fields', async () => {
      // Arrange - Updated product data
      const updatedData = {
        name: 'Updated Product Name',
        description: 'Updated description',
        price: 150,
        category: category1._id.toString(),
        quantity: 20
      };

      // Act - Send PUT request with updated data
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', updatedData.name)
        .field('description', updatedData.description)
        .field('price', updatedData.price)
        .field('category', updatedData.category)
        .field('quantity', updatedData.quantity);

      // Assert - Response indicates successful update
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product updated successfully');
      expect(response.body.products.name).toBe('Updated Product Name');
      expect(response.body.products.price).toBe(150);
      expect(response.body.products.quantity).toBe(20);

      // Assert - Product updated in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.name).toBe('Updated Product Name');
      expect(dbProduct.description).toBe('Updated description');
      expect(dbProduct.price).toBe(150);
      expect(dbProduct.quantity).toBe(20);
    });

    test('should update product and verify database state changes', async () => {
      // Arrange - New data
      const updatedData = {
        name: 'Changed Name',
        description: 'Changed description',
        price: 200,
        category: category1._id.toString(),
        quantity: 30
      };

      // Act - Update product
      await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', updatedData.name)
        .field('description', updatedData.description)
        .field('price', updatedData.price)
        .field('category', updatedData.category)
        .field('quantity', updatedData.quantity);

      // Assert - Verify changes persisted in database
      const updatedProduct = await productModel.findById(testProduct._id);
      expect(updatedProduct.name).toBe('Changed Name');
      expect(updatedProduct.description).toBe('Changed description');
      expect(updatedProduct.price).toBe(200);
      expect(updatedProduct.quantity).toBe(30);
    });
  });

  describe('Category Change and Slug Regeneration Integration Tests', () => {
    test('should regenerate slug when name changes', async () => {
      // Arrange - Change product name
      const newName = 'Completely New Product Name';

      // Act - Update product with new name
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', newName)
        .field('description', 'Updated description')
        .field('price', 100)
        .field('category', category1._id.toString())
        .field('quantity', 10);

      // Assert - Slug regenerated using slugify
      expect(response.status).toBe(201);
      expect(response.body.products.slug).toBe('Completely-New-Product-Name');

      // Assert - Verify slug in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.slug).toBe('Completely-New-Product-Name');
      expect(dbProduct.name).toBe(newName);
    });

    test('should change category and regenerate slug', async () => {
      // Arrange - Change both category and name
      const newName = 'Book Title Example';

      // Act - Update product with new category and name
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', newName)
        .field('description', 'This is now a book')
        .field('price', 25)
        .field('category', category2._id.toString()) // Change from Electronics to Books
        .field('quantity', 100);

      // Assert - Category changed and slug regenerated
      expect(response.status).toBe(201);
      expect(response.body.products.slug).toBe('Book-Title-Example');
      expect(response.body.products.category.toString()).toBe(category2._id.toString());

      // Assert - Verify in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.category.toString()).toBe(category2._id.toString());
      expect(dbProduct.slug).toBe('Book-Title-Example');
    });

    test('should use slugify library for slug generation on update', async () => {
      // Arrange - Name with special characters and spaces
      const complexName = 'iPhone 15 Pro Max (2024) - 256GB';

      // Act - Update with complex name
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', complexName)
        .field('description', 'Complex slug test')
        .field('price', 1299)
        .field('category', category1._id.toString())
        .field('quantity', 5);

      // Assert - Slugify handles special characters
      expect(response.status).toBe(201);
      expect(response.body.products.slug).toBe('iPhone-15-Pro-Max-(2024)-256GB');
    });
  });

  describe('Price Validation Integration Tests', () => {
    test('should reject negative price values', async () => {
      // Arrange - Update data with negative price
      const invalidData = {
        name: 'Test Product',
        description: 'Test description',
        price: -50, // Negative price
        category: category1._id.toString(),
        quantity: 10
      };

      // Act - Attempt to update with negative price
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', invalidData.name)
        .field('description', invalidData.description)
        .field('price', invalidData.price)
        .field('category', invalidData.category)
        .field('quantity', invalidData.quantity);

      // Assert - Should fail with validation error
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Price must be positive');

      // Assert - Product price unchanged in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.price).toBe(100); // Original price
    });

    test('should accept price of zero', async () => {
      // Arrange - Update data with zero price (free product)
      const freeProductData = {
        name: 'Free Sample',
        description: 'Free product',
        price: 0, // Zero price
        category: category1._id.toString(),
        quantity: 100
      };

      // Act - Update with zero price
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', freeProductData.name)
        .field('description', freeProductData.description)
        .field('price', freeProductData.price)
        .field('category', freeProductData.category)
        .field('quantity', freeProductData.quantity);

      // Assert - Should succeed with zero price
      expect(response.status).toBe(201);
      expect(response.body.products.price).toBe(0);

      // Assert - Verify in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.price).toBe(0);
    });

    test('should accept positive price values', async () => {
      // Arrange - Update data with positive price
      const validData = {
        name: 'Expensive Product',
        description: 'High value item',
        price: 9999.99,
        category: category1._id.toString(),
        quantity: 1
      };

      // Act - Update with positive price
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', validData.name)
        .field('description', validData.description)
        .field('price', validData.price)
        .field('category', validData.category)
        .field('quantity', validData.quantity);

      // Assert - Should succeed
      expect(response.status).toBe(201);
      expect(response.body.products.price).toBe(9999.99);
    });
  });

  describe('Quantity Validation Integration Tests', () => {
    test('should reject negative quantity values', async () => {
      // Arrange - Update data with negative quantity
      const invalidData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        category: category1._id.toString(),
        quantity: -10 // Negative quantity
      };

      // Act - Attempt to update with negative quantity
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', invalidData.name)
        .field('description', invalidData.description)
        .field('price', invalidData.price)
        .field('category', invalidData.category)
        .field('quantity', invalidData.quantity);

      // Assert - Should fail with validation error
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Quantity cannot be negative');

      // Assert - Product quantity unchanged in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.quantity).toBe(10); // Original quantity
    });

    test('should accept quantity of zero (out of stock)', async () => {
      // Arrange - Update data with zero quantity
      const outOfStockData = {
        name: 'Out of Stock Product',
        description: 'No inventory',
        price: 50,
        category: category1._id.toString(),
        quantity: 0 // Zero quantity
      };

      // Act - Update with zero quantity
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', outOfStockData.name)
        .field('description', outOfStockData.description)
        .field('price', outOfStockData.price)
        .field('category', outOfStockData.category)
        .field('quantity', outOfStockData.quantity);

      // Assert - Should succeed with zero quantity
      expect(response.status).toBe(201);
      expect(response.body.products.quantity).toBe(0);

      // Assert - Verify in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.quantity).toBe(0);
    });

    test('should accept positive quantity values', async () => {
      // Arrange - Update data with large quantity
      const largeStockData = {
        name: 'High Stock Product',
        description: 'Lots in inventory',
        price: 10,
        category: category1._id.toString(),
        quantity: 10000
      };

      // Act - Update with large quantity
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', largeStockData.name)
        .field('description', largeStockData.description)
        .field('price', largeStockData.price)
        .field('category', largeStockData.category)
        .field('quantity', largeStockData.quantity);

      // Assert - Should succeed
      expect(response.status).toBe(201);
      expect(response.body.products.quantity).toBe(10000);
    });
  });

  describe('Photo Update and Null Safety Integration Tests', () => {
    test('should update product photo successfully', async () => {
      // Arrange - Product data with new photo
      const updateData = {
        name: 'Product With New Photo',
        description: 'Photo updated',
        price: 100,
        category: category1._id.toString(),
        quantity: 10
      };

      // Act - Update product with new photo
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', updateData.name)
        .field('description', updateData.description)
        .field('price', updateData.price)
        .field('category', updateData.category)
        .field('quantity', updateData.quantity)
        .attach('photo', testImagePath);

      // Assert - Photo updated
      expect(response.status).toBe(201);

      // Assert - Verify photo in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.photo).toBeDefined();
      expect(dbProduct.photo.data).toBeInstanceOf(Buffer);
      expect(dbProduct.photo.contentType).toBe('image/jpeg');
    });

    test('should handle photo null safety when product has no existing photo', async () => {
      // Arrange - Create product without photo
      const productWithoutPhoto = await productModel.create({
        name: 'No Photo Product',
        slug: 'no-photo-product',
        description: 'Testing photo null safety',
        price: 50,
        category: category1._id,
        quantity: 5
        // No photo field
      });

      // Act - Update and add photo to product that had no photo
      const response = await request(app)
        .put(`/api/v1/product/update-product/${productWithoutPhoto._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Now Has Photo')
        .field('description', 'Photo added')
        .field('price', 50)
        .field('category', category1._id.toString())
        .field('quantity', 5)
        .attach('photo', testImagePath);

      // Assert - Photo added successfully (null safety works)
      expect(response.status).toBe(201);

      // Assert - Photo exists in database
      const dbProduct = await productModel.findById(productWithoutPhoto._id);
      expect(dbProduct.photo).toBeDefined();
      expect(dbProduct.photo.data).toBeInstanceOf(Buffer);
    });

    test('should update product without changing photo', async () => {
      // Arrange - Original photo data
      const originalPhoto = testProduct.photo.data;

      // Act - Update product fields without providing new photo
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Updated Name Only')
        .field('description', 'Updated description')
        .field('price', 150)
        .field('category', category1._id.toString())
        .field('quantity', 15);
        // No photo attached

      // Assert - Update successful
      expect(response.status).toBe(201);

      // Assert - Photo unchanged in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.photo.data).toEqual(originalPhoto);
      expect(dbProduct.photo.contentType).toBe('image/jpeg');
    });
  });

  describe('Product Existence Validation Integration Tests', () => {
    test('should return 404 when updating non-existent product', async () => {
      // Arrange - Valid ObjectId that doesn't exist
      const nonExistentId = '507f1f77bcf86cd799439011';

      // Act - Attempt to update non-existent product
      const response = await request(app)
        .put(`/api/v1/product/update-product/${nonExistentId}`)
        .set('Authorization', adminToken)
        .field('name', 'Should Fail')
        .field('description', 'Does not exist')
        .field('price', 100)
        .field('category', category1._id.toString())
        .field('quantity', 10);

      // Assert - Should return 404
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    test('should check product existence before applying updates', async () => {
      // Arrange - Delete product first
      await productModel.findByIdAndDelete(testProduct._id);

      // Act - Attempt to update deleted product
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Attempting Update')
        .field('description', 'Product was deleted')
        .field('price', 100)
        .field('category', category1._id.toString())
        .field('quantity', 10);

      // Assert - Should return 404
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('findByIdAndUpdate Integration Tests', () => {
    test('should use findByIdAndUpdate with new: true option', async () => {
      // Arrange - Update data
      const updateData = {
        name: 'Testing findByIdAndUpdate',
        description: 'Verifying new: true returns updated document',
        price: 250,
        category: category1._id.toString(),
        quantity: 25
      };

      // Act - Update product
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', updateData.name)
        .field('description', updateData.description)
        .field('price', updateData.price)
        .field('category', updateData.category)
        .field('quantity', updateData.quantity);

      // Assert - Response contains updated values (because of new: true)
      expect(response.status).toBe(201);
      expect(response.body.products.name).toBe('Testing findByIdAndUpdate');
      expect(response.body.products.price).toBe(250);

      // Assert - Database also has updated values
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.name).toBe('Testing findByIdAndUpdate');
      expect(dbProduct.price).toBe(250);
    });
  });

  describe('Required Field Validation Integration Tests', () => {
    test('should require all mandatory fields for update', async () => {
      // Arrange - Missing required field (name)
      const incompleteData = {
        // Missing name
        description: 'Missing name field',
        price: 100,
        category: category1._id.toString(),
        quantity: 10
      };

      // Act - Attempt update without name
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('description', incompleteData.description)
        .field('price', incompleteData.price)
        .field('category', incompleteData.category)
        .field('quantity', incompleteData.quantity);

      // Assert - Should fail validation
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Name is required');
    });
  });

  describe('Admin Authentication Integration Tests', () => {
    test('should require admin authentication for updates', async () => {
      // Arrange - Create regular user
      const regularUser = await userModel.create({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'password123',
        phone: '9876543210',
        address: { street: '456 User St' },
        answer: 'user answer',
        role: 0 // Regular user
      });

      const userToken = JWT.sign(
        { _id: regularUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Act - Attempt update with non-admin token
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', userToken)
        .field('name', 'Unauthorized Update')
        .field('description', 'Should fail')
        .field('price', 100)
        .field('category', category1._id.toString())
        .field('quantity', 10);

      // Assert - Should fail with 401
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      // Assert - Product unchanged in database
      const dbProduct = await productModel.findById(testProduct._id);
      expect(dbProduct.name).toBe('Original Product Name'); // Unchanged
    });
  });

  describe('Photo Size Validation Integration Tests', () => {
    test('should reject photo larger than 1MB', async () => {
      // Arrange - Create large test file (> 1MB)
      const largeFilePath = path.join(__dirname, 'large-update-image.jpg');
      const largeBuffer = Buffer.alloc(1500000); // 1.5 MB
      fs.writeFileSync(largeFilePath, largeBuffer);

      // Act - Attempt update with large photo
      const response = await request(app)
        .put(`/api/v1/product/update-product/${testProduct._id}`)
        .set('Authorization', adminToken)
        .field('name', 'Large Photo Test')
        .field('description', 'Testing large photo rejection')
        .field('price', 100)
        .field('category', category1._id.toString())
        .field('quantity', 10)
        .attach('photo', largeFilePath);

      // Assert - Should fail with size validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Photo is required and must be less than 1MB');

      // Cleanup
      fs.unlinkSync(largeFilePath);
    });
  });
});
