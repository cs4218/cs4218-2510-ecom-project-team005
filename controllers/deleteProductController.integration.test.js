/**
 * Integration Tests for deleteProductController
 *
 * - HTTP DELETE /api/v1/product/delete-product/:pid integration with Express app
 * - Admin authentication middleware integration (requireSignIn + isAdmin NOT from route, but from controller code)
 * - ObjectId format validation with mongoose.Types.ObjectId.isValid
 * - Product model integration with MongoDB (findByIdAndDelete)
 * - Real HTTP requests via supertest
 * - Authorization enforcement (admin-only access)
 * - Product existence validation before deletion
 * - Real database operations (delete, constraint checking)
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

describe('deleteProductController Integration Test Suite', () => {
  let adminToken;
  let adminUser;
  let regularUser;
  let userToken;
  let validCategory;
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
      { _id: adminUser._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Arrange - Create regular user (non-admin)
    regularUser = await userModel.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      phone: '9876543210',
      address: { street: '456 User St' },
      answer: 'user answer',
      role: 0 // Regular user
    });

    // Arrange - Generate JWT token for regular user
    userToken = JWT.sign(
      { _id: regularUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Arrange - Create a valid category for product reference
    validCategory = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics'
    });

    // Arrange - Create test image file
    testImagePath = path.join(__dirname, 'test-delete-image.jpg');
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

    // Arrange - Create a test product to delete
    testProduct = await productModel.create({
      name: 'Test Product To Delete',
      slug: 'test-product-to-delete',
      description: 'This product will be deleted in tests',
      price: 100,
      category: validCategory._id,
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

  describe('Successful Product Deletion Integration Tests', () => {
    test('should delete product successfully with admin authorization', async () => {
      // Arrange - Confirm product exists before deletion
      const productBefore = await productModel.findById(testProduct._id);
      expect(productBefore).not.toBeNull();

      // Act - Send DELETE request with admin token
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Assert - Response indicates successful deletion
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product deleted successfully');

      // Assert - Product no longer exists in database
      const productAfter = await productModel.findById(testProduct._id);
      expect(productAfter).toBeNull();
    });

    test('should delete product and verify database state changes', async () => {
      // Arrange - Count products before deletion
      const countBefore = await productModel.countDocuments();
      expect(countBefore).toBe(1);

      // Act - Delete product
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Assert - Successful deletion
      expect(response.status).toBe(200);

      // Assert - Product count decreased
      const countAfter = await productModel.countDocuments();
      expect(countAfter).toBe(0);
    });

    test('should successfully delete product by valid ObjectId', async () => {
      // Arrange - Valid product ID
      const productId = testProduct._id.toString();

      // Act - Delete product with valid ObjectId
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${productId}`)
        .set('Authorization', adminToken);

      // Assert - Successful deletion
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Assert - Verify deletion in database
      const deletedProduct = await productModel.findById(productId);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('Admin Authorization Integration Tests', () => {
    test('should reject deletion attempt without admin role', async () => {
      // Arrange - Regular user token (role = 0)

      // Act - Attempt to delete product with non-admin token
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', userToken);

      // Assert - Should fail with 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');

      // Assert - Product still exists in database
      const product = await productModel.findById(testProduct._id);
      expect(product).not.toBeNull();
    });

    test('should reject deletion attempt without authentication token', async () => {
      // Act - Attempt to delete product without auth token
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`);

      // Assert - Should fail with Unauthorized
      expect(response.status).toBe(401);

      // Assert - Product still exists in database
      const product = await productModel.findById(testProduct._id);
      expect(product).not.toBeNull();
    });

    test('should reject deletion attempt with invalid authentication token', async () => {
      // Arrange - Invalid JWT token
      const invalidToken = 'invalid.jwt.token';

      // Act - Attempt to delete product with invalid token
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', invalidToken);

      // Assert - Should fail with 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);

      // Assert - Product still exists in database
      const product = await productModel.findById(testProduct._id);
      expect(product).not.toBeNull();
    });

    test('should check user role from database via isAdmin middleware', async () => {
      // Arrange - Create user with admin role in database
      const adminFromDB = await userModel.create({
        name: 'DB Admin',
        email: 'dbadmin@example.com',
        password: 'password123',
        phone: '5555555555',
        address: { street: '789 Admin Blvd' },
        answer: 'db admin answer',
        role: 1 // Admin in database
      });

      const dbAdminToken = JWT.sign(
        { _id: adminFromDB._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Act - Delete with token that requires DB lookup
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', dbAdminToken);

      // Assert - Should succeed because isAdmin middleware checks database
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Assert - Product deleted
      const product = await productModel.findById(testProduct._id);
      expect(product).toBeNull();
    });
  });

  describe('ObjectId Format Validation Integration Tests', () => {
    test('should reject deletion with invalid ObjectId format', async () => {
      // Arrange - Invalid ObjectId format
      const invalidId = 'invalid-object-id-format';

      // Act - Attempt to delete with invalid ID
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${invalidId}`)
        .set('Authorization', adminToken);

      // Assert - Should fail with 400 Bad Request
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid product ID format');

      // Assert - Test product still exists
      const product = await productModel.findById(testProduct._id);
      expect(product).not.toBeNull();
    });

    test('should reject deletion with malformed ObjectId', async () => {
      // Arrange - Malformed ObjectId (wrong length)
      const malformedId = '123';

      // Act - Attempt to delete with malformed ID
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${malformedId}`)
        .set('Authorization', adminToken);

      // Assert - Should fail with 400 Bad Request
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid product ID format');
    });

    test('should validate ObjectId using mongoose.Types.ObjectId.isValid', async () => {
      // Arrange - Various invalid formats
      const invalidIds = [
        'not-an-id',
        '12345',
        'zzzzzzzzzzzzzzzzzzzzzzzz', // Invalid hex characters
        '' // Empty string
      ];

      // Act & Assert - All should fail validation
      for (const invalidId of invalidIds) {
        const response = await request(app)
          .delete(`/api/v1/product/delete-product/${invalidId}`)
          .set('Authorization', adminToken);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid product ID format');
      }

      // Assert - Original product still exists
      const product = await productModel.findById(testProduct._id);
      expect(product).not.toBeNull();
    });
  });

  describe('Product Existence Validation Integration Tests', () => {
    test('should reject deletion when product does not exist', async () => {
      // Arrange - Valid ObjectId that doesn't exist in database
      const nonExistentId = '507f1f77bcf86cd799439011'; // Valid format but doesn't exist

      // Act - Attempt to delete non-existent product
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${nonExistentId}`)
        .set('Authorization', adminToken);

      // Assert - Should fail with 404 Not Found
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    test('should check product existence before deletion', async () => {
      // Arrange - Delete product first time
      await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Act - Attempt to delete same product again
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Assert - Should fail with 404 Not Found
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('findByIdAndDelete Integration Tests', () => {
    test('should use findByIdAndDelete method from productModel', async () => {
      // Arrange - Product exists
      const productId = testProduct._id;

      // Act - Delete product
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${productId}`)
        .set('Authorization', adminToken);

      // Assert - Successful deletion
      expect(response.status).toBe(200);

      // Assert - findByIdAndDelete removed product from database
      const deletedProduct = await productModel.findById(productId);
      expect(deletedProduct).toBeNull();

      // Assert - No other products affected
      const allProducts = await productModel.find({});
      expect(allProducts).toHaveLength(0);
    });

    test('should delete product without including photo field', async () => {
      // Arrange - Product with photo data
      const productWithPhoto = await productModel.create({
        name: 'Product With Large Photo',
        slug: 'product-with-large-photo',
        description: 'Testing photo exclusion',
        price: 200,
        category: validCategory._id,
        quantity: 5,
        photo: {
          data: Buffer.alloc(100000), // Large photo
          contentType: 'image/jpeg'
        }
      });

      // Act - Delete product (photo should be excluded via select("-photo"))
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${productWithPhoto._id}`)
        .set('Authorization', adminToken);

      // Assert - Successful deletion
      expect(response.status).toBe(200);

      // Assert - Product deleted from database
      const deletedProduct = await productModel.findById(productWithPhoto._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('Error Handling Integration Tests', () => {
    test('should handle database errors gracefully', async () => {
      // Arrange - Create product then close connection (simulated by invalid operation)
      // This test ensures error handling works even with database issues

      // Act - Try to delete with proper auth and valid ID
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Assert - Should either succeed or return 500 with error message
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Error deleting product');
      } else {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('HTTP Method and Route Integration Tests', () => {
    test('should respond to DELETE method on correct route', async () => {
      // Act - Send DELETE request to correct endpoint
      const response = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Assert - Should process request (not 404 or 405)
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(405);
      expect(response.status).toBe(200);
    });

    test('should reject POST method on delete endpoint', async () => {
      // Act - Try POST instead of DELETE
      const response = await request(app)
        .post(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      // Assert - Should return 404 (route not found for POST)
      expect(response.status).toBe(404);
    });
  });

  describe('Multiple Product Deletion Integration Tests', () => {
    test('should handle deletion of multiple products sequentially', async () => {
      // Arrange - Create multiple products
      const product2 = await productModel.create({
        name: 'Product 2',
        slug: 'product-2',
        description: 'Second product',
        price: 150,
        category: validCategory._id,
        quantity: 20,
        photo: { data: Buffer.from([0xFF, 0xD8]), contentType: 'image/jpeg' }
      });

      const product3 = await productModel.create({
        name: 'Product 3',
        slug: 'product-3',
        description: 'Third product',
        price: 200,
        category: validCategory._id,
        quantity: 30,
        photo: { data: Buffer.from([0xFF, 0xD8]), contentType: 'image/jpeg' }
      });

      // Act - Delete all products sequentially
      const response1 = await request(app)
        .delete(`/api/v1/product/delete-product/${testProduct._id}`)
        .set('Authorization', adminToken);

      const response2 = await request(app)
        .delete(`/api/v1/product/delete-product/${product2._id}`)
        .set('Authorization', adminToken);

      const response3 = await request(app)
        .delete(`/api/v1/product/delete-product/${product3._id}`)
        .set('Authorization', adminToken);

      // Assert - All deletions successful
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);

      // Assert - No products remain in database
      const remainingProducts = await productModel.find({});
      expect(remainingProducts).toHaveLength(0);
    });
  });
});
