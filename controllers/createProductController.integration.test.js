/**
 * Integration Tests for createProductController
 *
 * - HTTP POST /api/v1/product/create-product integration with Express app
 * - Admin authentication middleware integration (requireSignIn + isAdmin)
 * - express-formidable middleware integration for multipart/form-data
 * - File upload handling with fs.readFileSync integration
 * - slugify library integration for slug generation
 * - Category foreign key validation with MongoDB
 * - Product model integration with MongoDB (validation, save)
 * - Real HTTP requests via supertest
 * - File type validation (image only)
 * - Photo size validation (max 1MB)
 * - Real database operations (create, constraint checking)
 *
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
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

describe('createProductController Integration Test Suite', () => {
  let adminToken;
  let adminUser;
  let validCategory;
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

    // Arrange - Create a valid category for product reference
    validCategory = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics'
    });

    // Arrange - Create test image file
    testImagePath = path.join(__dirname, 'test-image.jpg');
    // Create a minimal valid JPEG (1x1 pixel)
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
  });

  describe('Successful Product Creation Integration Tests', () => {
    test('should create product successfully with all valid fields and admin auth', async () => {
      // Arrange - Product data with all required fields
      const productData = {
        name: 'iPhone 14',
        description: 'Latest Apple smartphone with advanced features',
        price: 999,
        category: validCategory._id.toString(),
        quantity: 50
      };

      // Act - Send POST request with multipart/form-data
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Response indicates success
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product created successfully');
      expect(response.body.products).toBeDefined();
      expect(response.body.products.name).toBe('iPhone 14');
      expect(response.body.products.slug).toBe('iPhone-14'); // slugify integration (preserves case by default)
      expect(response.body.products.price).toBe(999);
      expect(response.body.products.category.toString()).toBe(validCategory._id.toString());

      // Assert - Product exists in database
      const dbProduct = await productModel.findOne({ name: 'iPhone 14' });
      expect(dbProduct).not.toBeNull();
      expect(dbProduct.slug).toBe('iPhone-14');
      expect(dbProduct.photo).toBeDefined();
      expect(dbProduct.photo.data).toBeInstanceOf(Buffer);
      expect(dbProduct.photo.contentType).toBe('image/jpeg');
    });

    test('should generate correct slug using slugify integration', async () => {
      // Arrange - Product with complex name requiring slugification
      const productData = {
        name: 'Samsung Galaxy S23 Ultra 5G',
        description: 'Flagship Android smartphone',
        price: 1199,
        category: validCategory._id.toString(),
        quantity: 30
      };

      // Act - Create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Slug correctly generated by slugify
      expect(response.status).toBe(201);
      expect(response.body.products.slug).toBe('Samsung-Galaxy-S23-Ultra-5G'); // Preserves case by default

      // Assert - Verify in database
      const dbProduct = await productModel.findOne({ slug: 'Samsung-Galaxy-S23-Ultra-5G' });
      expect(dbProduct).not.toBeNull();
      expect(dbProduct.name).toBe('Samsung Galaxy S23 Ultra 5G');
    });

    test('should store photo data correctly with fs.readFileSync integration', async () => {
      // Arrange - Product data
      const productData = {
        name: 'Test Product',
        description: 'Testing photo storage',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Create product with photo
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Photo stored in database
      expect(response.status).toBe(201);
      const dbProduct = await productModel.findById(response.body.products._id);
      expect(dbProduct.photo).toBeDefined();
      expect(dbProduct.photo.data).toBeInstanceOf(Buffer);
      expect(dbProduct.photo.data.length).toBeGreaterThan(0);
      expect(dbProduct.photo.contentType).toBe('image/jpeg');
    });
  });

  describe('Category Foreign Key Validation Integration Tests', () => {
    test('should validate category reference exists in database', async () => {
      // Arrange - Product with valid category ID
      const productData = {
        name: 'Test Product',
        description: 'Testing category validation',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Product created with valid category reference
      expect(response.status).toBe(201);
      const dbProduct = await productModel.findById(response.body.products._id).populate('category');
      expect(dbProduct.category).toBeDefined();
      expect(dbProduct.category._id.toString()).toBe(validCategory._id.toString());
      expect(dbProduct.category.name).toBe('Electronics');
    });

    test('should reject product with invalid category ObjectId format', async () => {
      // Arrange - Product with invalid category ID format
      const productData = {
        name: 'Test Product',
        description: 'Testing invalid category',
        price: 100,
        category: 'invalid-id-format', // Invalid ObjectId
        quantity: 10
      };

      // Act - Attempt to create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error creating product');
    });
  });

  describe('Admin Authentication Integration Tests', () => {
    test('should reject product creation without admin token', async () => {
      // Arrange - Product data
      const productData = {
        name: 'Unauthorized Product',
        description: 'Should not be created',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product without auth token
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized Access');

      // Assert - Product not created in database
      const dbProduct = await productModel.findOne({ name: 'Unauthorized Product' });
      expect(dbProduct).toBeNull();
    });

    test('should reject product creation with non-admin user token', async () => {
      // Arrange - Create regular user (role = 0)
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

      // Arrange - Product data
      const productData = {
        name: 'Unauthorized Product',
        description: 'Should not be created',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product with non-admin token
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', userToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized Access');

      // Assert - Product not created in database
      const dbProduct = await productModel.findOne({ name: 'Unauthorized Product' });
      expect(dbProduct).toBeNull();
    });

    test('should reject product creation with invalid token', async () => {
      // Arrange - Invalid JWT token
      const invalidToken = 'invalid.jwt.token';

      // Arrange - Product data
      const productData = {
        name: 'Unauthorized Product',
        description: 'Should not be created',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product with invalid token
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', invalidToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized Access');
    });
  });

  describe('Required Field Validation Integration Tests', () => {
    test('should reject product creation when name is missing', async () => {
      // Arrange - Product data without name
      const productData = {
        // Missing name
        description: 'Test description',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Name is required');
    });

    test('should reject product creation when description is missing', async () => {
      // Arrange - Product data without description
      const productData = {
        name: 'Test Product',
        // Missing description
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Description is required');
    });

    test('should reject product creation when price is missing', async () => {
      // Arrange - Product data without price
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        // Missing price
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Price is required');
    });

    test('should reject product creation when category is missing', async () => {
      // Arrange - Product data without category
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        // Missing category
        quantity: 10
      };

      // Act - Attempt to create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Category is required');
    });

    test('should reject product creation when quantity is missing', async () => {
      // Arrange - Product data without quantity
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        category: validCategory._id.toString()
        // Missing quantity
      };

      // Act - Attempt to create product
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .attach('photo', testImagePath);

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Quantity is required');
    });

    test('should reject product creation when photo is missing', async () => {
      // Arrange - Product data without photo
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product without photo
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity);
        // No photo attached

      // Assert - Should fail with validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Photo is required and must be less than 1MB');
    });
  });

  describe('Photo Size Validation Integration Tests', () => {
    test('should reject photo larger than 1MB', async () => {
      // Arrange - Create large test file (> 1MB)
      const largeFilePath = path.join(__dirname, 'large-test-image.jpg');
      const largeBuffer = Buffer.alloc(1500000); // 1.5 MB
      fs.writeFileSync(largeFilePath, largeBuffer);

      // Arrange - Product data
      const productData = {
        name: 'Test Product',
        description: 'Testing large photo',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product with large photo
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', largeFilePath);

      // Assert - Should fail with size validation error
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Photo is required and must be less than 1MB');

      // Cleanup - Remove large test file
      fs.unlinkSync(largeFilePath);
    });

    test('should accept photo smaller than 1MB', async () => {
      // Arrange - Product data with small photo (already using testImagePath which is tiny)
      const productData = {
        name: 'Test Product',
        description: 'Testing small photo',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Create product with small photo
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should succeed
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('File Type Validation Integration Tests', () => {
    test('should accept valid JPEG image files', async () => {
      // Arrange - Product data
      const productData = {
        name: 'Test Product JPEG',
        description: 'Testing JPEG upload',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Create product with JPEG
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - Should succeed
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.products.photo.contentType).toBe('image/jpeg');
    });

    test('should reject non-image file types', async () => {
      // Arrange - Create test text file
      const txtFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(txtFilePath, 'This is a text file, not an image');

      // Arrange - Product data
      const productData = {
        name: 'Test Product',
        description: 'Testing non-image file',
        price: 100,
        category: validCategory._id.toString(),
        quantity: 10
      };

      // Act - Attempt to create product with text file
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', txtFilePath);

      // Assert - Should fail with file type validation error
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Only image files are allowed');

      // Cleanup - Remove test text file
      fs.unlinkSync(txtFilePath);
    });
  });

  describe('express-formidable Middleware Integration Tests', () => {
    test('should correctly parse multipart form data with req.fields', async () => {
      // Arrange - Product data
      const productData = {
        name: 'Multipart Test',
        description: 'Testing formidable integration',
        price: 250,
        category: validCategory._id.toString(),
        quantity: 15
      };

      // Act - Send multipart request
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - All fields correctly parsed by formidable
      expect(response.status).toBe(201);
      expect(response.body.products.name).toBe('Multipart Test');
      expect(response.body.products.description).toBe('Testing formidable integration');
      expect(response.body.products.price).toBe(250);
      expect(response.body.products.quantity).toBe(15);
    });

    test('should correctly parse file data with req.files', async () => {
      // Arrange - Product data
      const productData = {
        name: 'File Upload Test',
        description: 'Testing file parsing',
        price: 300,
        category: validCategory._id.toString(),
        quantity: 20
      };

      // Act - Send multipart request with file
      const response = await request(app)
        .post('/api/v1/product/create-product')
        .set('Authorization', adminToken)
        .field('name', productData.name)
        .field('description', productData.description)
        .field('price', productData.price)
        .field('category', productData.category)
        .field('quantity', productData.quantity)
        .attach('photo', testImagePath);

      // Assert - File correctly parsed and stored
      expect(response.status).toBe(201);
      const dbProduct = await productModel.findById(response.body.products._id);
      expect(dbProduct.photo).toBeDefined();
      expect(dbProduct.photo.data).toBeInstanceOf(Buffer);
      expect(dbProduct.photo.contentType).toBe('image/jpeg');
    });
  });
});
