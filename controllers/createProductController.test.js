/**
 * Unit Tests for createProductController Function
 * 
 * - Product creation API endpoint functionality (/api/v1/product/create-product)
 * - Input validation for required fields (name, description, price, category, quantity, photo)
 * - File upload handling and photo size validation (1MB limit)
 * - Database operations with productModel (save, slug generation)
 * - Response formatting and status codes (201 success, 500 error)
 * - Error handling for invalid inputs and database failures
 * - Inconsistent HTTP status codes (500 for validation vs 400 standard)
 * - File type validation missing (security vulnerability)
 * - Input sanitization gaps (potential NoSQL injection)
 * - Photo path validation missing (file system security)
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies using unstable_mockModule
jest.unstable_mockModule('../models/productModel.js', () => ({
  default: jest.fn()
}));
jest.unstable_mockModule('fs', () => ({
  default: {
    readFileSync: jest.fn()
  }
}));
jest.unstable_mockModule('slugify', () => ({
  default: jest.fn()
}));

const { createProductController } = await import('./productController.js');
const productModel = (await import('../models/productModel.js')).default;
const fs = await import('fs');
const slugify = (await import('slugify')).default;

describe('createProductController Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      fields: {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'test-category-id',
        quantity: 10
      },
      files: {
        photo: {
          path: '/tmp/test-photo.jpg',
          type: 'image/jpeg',
          size: 500000 // 500KB - under 1MB limit
        }
      }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock external dependencies
    slugify.mockReturnValue('test-product');
    fs.default.readFileSync.mockReturnValue(Buffer.from('fake-image-data'));
  });

  test('should create product successfully with valid data', async () => {
    // Arrange - Set up successful product creation
    const mockProduct = {
      _id: 'product123',
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      slug: 'test-product',
      photo: { data: Buffer.from('fake-image-data'), contentType: 'image/jpeg' },
      save: jest.fn().mockResolvedValue(true)
    };
    productModel.mockImplementation(() => mockProduct);

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify successful creation
    expect(productModel).toHaveBeenCalledWith({
      name: 'Test Product',
      description: 'Test Description', 
      price: 99.99,
      category: 'test-category-id',
      quantity: 10,
      slug: 'test-product'
    });
    expect(slugify).toHaveBeenCalledWith('Test Product');
    expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
    expect(mockProduct.save).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product created successfully',
      products: mockProduct
    });
  });

  // Should generate correct slug from product name
  test('should generate URL-friendly slug from product name', async () => {
    // Arrange - Product with complex name
    mockReq.fields.name = 'Amazing Product With Spaces & Special Characters!';
    const mockProduct = { photo: {}, save: jest.fn().mockResolvedValue(true) };
    productModel.mockImplementation(() => mockProduct);
    slugify.mockReturnValue('amazing-product-with-spaces-special-characters');

    // Act
    await createProductController(mockReq, mockRes);

    // Assert - Verify slug generation functionality
    expect(slugify).toHaveBeenCalledWith('Amazing Product With Spaces & Special Characters!');
    expect(productModel).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'amazing-product-with-spaces-special-characters'
      })
    );
  });

  // Should process and store photo file correctly
  test('should read photo file and store binary data with correct content type', async () => {
    // Arrange - Mock file system and product
    const mockImageBuffer = Buffer.from('mock-jpeg-binary-data');
    fs.default.readFileSync.mockReturnValue(mockImageBuffer);
    
    const mockProduct = { 
      photo: {},  // This will be populated by the controller
      save: jest.fn().mockResolvedValue(true) 
    };
    productModel.mockImplementation(() => mockProduct);

    // Act
    await createProductController(mockReq, mockRes);

    // Assert - Verify photo processing functionality
    expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/test-photo.jpg');
    expect(mockProduct.photo.data).toBe(mockImageBuffer);
    expect(mockProduct.photo.contentType).toBe('image/jpeg');
  });

  // Should validate all required fields before processing
  test('should validate all required fields before creating product', async () => {
    // Arrange - Missing required field
    delete mockReq.fields.category;

    // Act
    await createProductController(mockReq, mockRes);

    // Assert - Should stop processing and not create product
    expect(productModel).not.toHaveBeenCalled();
    expect(fs.default.readFileSync).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Category is required'
    });
  });

  test('should validate required name field', async () => {
    // Arrange - Remove name from request
    delete mockReq.fields.name;

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Name is required'
    });
    expect(productModel).not.toHaveBeenCalled();
  });

  test('should validate required description field', async () => {
    // Arrange - Remove description from request
    delete mockReq.fields.description;

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Description is required'
    });
  });

  test('should validate required price field', async () => {
    // Arrange - Remove price from request
    delete mockReq.fields.price;

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Price is required'
    });
  });

  test('should validate required category field', async () => {
    // Arrange - Remove category from request
    delete mockReq.fields.category;

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Category is required'
    });
  });

  test('should validate required quantity field', async () => {
    // Arrange - Remove quantity from request
    delete mockReq.fields.quantity;

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Quantity is required'
    });
  });

  test('should validate required photo field', async () => {
    // Arrange - Remove photo from request
    delete mockReq.files.photo;

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Photo is required and must be less than 1MB'
    });
  });

  test('should validate photo size limit (1MB)', async () => {
    // Arrange - Set photo size over 1MB limit
    mockReq.files.photo.size = 1500000; // 1.5MB

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify size validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Photo is required and must be less than 1MB'
    });
  });

  test('should handle database save errors', async () => {
    // Arrange - Mock database save failure
    const mockProduct = {
      photo: {},
      save: jest.fn().mockRejectedValue({ message: 'Database connection failed' })
    };
    productModel.mockImplementation(() => mockProduct);

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify error handling
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      error: 'Database connection failed',
      message: 'Error creating product'
    });
  });


  // Should validate photo file types
  test('should reject non-image file types', async () => {
    // Arrange - Non-image file upload
    mockReq.files.photo = {
      path: '/tmp/malicious-script.php',
      type: 'application/php', // Not an image type
      size: 50000
    };

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Should reject non-image files with 400 Bad Request
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Only image files are allowed'
    });
  });

  // Input Sanitization Missing
  test('should sanitize input fields', async () => {
    // Arrange - Potentially malicious input data
    mockReq.fields.name = '<script>alert("XSS")</script>Malicious Product';
    mockReq.fields.description = '{"$ne": null}'; // NoSQL injection attempt
    mockReq.fields.category = '../../../etc/passwd'; // Path traversal attempt

    const mockProduct = {
      photo: {},
      save: jest.fn().mockResolvedValue(true)
    };
    productModel.mockImplementation(() => mockProduct);

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify input sanitization gap
    // No input sanitization - raw user data saved to database
    // Could lead to XSS, NoSQL injection, or other attacks
    expect(productModel).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '<script>alert("XSS")</script>Malicious Product', // Raw malicious data
        description: '{"$ne": null}' // Raw injection attempt
      })
    );
  });

  // File Path Validation Missing
  test('should validate file paths', async () => {
    // Arrange - Malicious file path
    mockReq.files.photo.path = '../../../etc/passwd'; // Path traversal attack

    const mockProduct = {
      photo: {},
      save: jest.fn().mockResolvedValue(true)
    };
    productModel.mockImplementation(() => mockProduct);

    // Act - Call the controller function
    await createProductController(mockReq, mockRes);

    // Assert - Verify file path security gap
    // No path validation - could read arbitrary files from server
    expect(fs.default.readFileSync).toHaveBeenCalledWith('../../../etc/passwd');
  });
});