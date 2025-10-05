/**
 * Unit Tests for updateProductController Function
 * 
 * - Product update API endpoint functionality (/api/v1/product/update-product/:pid)
 * - Input validation for required fields (name, description, price, category, quantity)
 * - Optional photo update handling and file size validation
 * - Database operations with productModel.findByIdAndUpdate()
 * - Slug regeneration when product name changes
 * - Response formatting and status codes (201 success, 500 error)
 * - Error handling for invalid inputs and database failures
 * - Inconsistent photo validation (required vs optional)
 * - Missing product existence check before update
 * - Partial update validation gaps (price could be negative)
 * - Slug collision handling missing (duplicate slugs)
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies using unstable_mockModule
jest.unstable_mockModule('../models/productModel.js', () => ({
  default: {
    findByIdAndUpdate: jest.fn()
  }
}));
jest.unstable_mockModule('fs', () => ({
  default: {
    readFileSync: jest.fn()
  }
}));
jest.unstable_mockModule('slugify', () => ({
  default: jest.fn()
}));

const { updateProductController } = await import('./productController.js');
const productModel = (await import('../models/productModel.js')).default;
const fs = await import('fs');
const slugify = (await import('slugify')).default;

describe('updateProductController Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      params: {
        pid: 'product-id-123'
      },
      fields: {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 149.99,
        category: 'updated-category-id',
        quantity: 15,
        shipping: true
      },
      files: {
        photo: {
          path: '/tmp/updated-photo.jpg',
          type: 'image/jpeg', 
          size: 800000 // 800KB - under 1MB limit
        }
      }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Mock external dependencies
    slugify.mockReturnValue('updated-product');
    fs.default.readFileSync.mockReturnValue(Buffer.from('updated-image-data'));
  });

  test('should update product successfully with all fields', async () => {
    // Arrange - Set up successful product update
    const mockUpdatedProduct = {
      _id: 'product-id-123',
      name: 'Updated Product',
      description: 'Updated Description',
      price: 149.99,
      slug: 'updated-product',
      photo: { data: Buffer.from('updated-image-data'), contentType: 'image/jpeg' },
      save: jest.fn().mockResolvedValue(true)
    };
    productModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Verify successful update
    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'product-id-123',
      {
        name: 'Updated Product',
        description: 'Updated Description',
        price: 149.99,
        category: 'updated-category-id',
        quantity: 15,
        shipping: true,
        slug: 'updated-product'
      },
      { new: true }
    );
    expect(slugify).toHaveBeenCalledWith('Updated Product');
    expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/updated-photo.jpg');
    expect(mockUpdatedProduct.save).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product updated successfully',
      products: mockUpdatedProduct
    });
  });

  // Should regenerate slug when product name changes
  test('should regenerate slug when product name is updated', async () => {
    // Arrange - Update with new name
    mockReq.fields.name = 'Completely New Product Name';
    const mockProduct = { save: jest.fn().mockResolvedValue(true) };
    productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);
    slugify.mockReturnValue('completely-new-product-name');

    // Act
    await updateProductController(mockReq, mockRes);

    // Assert - Verify slug regeneration functionality
    expect(slugify).toHaveBeenCalledWith('Completely New Product Name');
    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'product-id-123',
      expect.objectContaining({
        name: 'Completely New Product Name',
        slug: 'completely-new-product-name'
      }),
      { new: true }
    );
  });

  // Should update only changed fields, not all fields
  test('should update only provided fields, keeping others unchanged', async () => {
    // Arrange - Update only price and quantity
    mockReq.fields = {
      name: 'Same Name',
      description: 'Same Description', 
      price: 199.99,  // Changed
      category: 'same-category',
      quantity: 25,   // Changed
      shipping: false // Changed
    };
    delete mockReq.files.photo; // No photo update
    
    const mockProduct = { save: jest.fn().mockResolvedValue(true) };
    productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

    // Act
    await updateProductController(mockReq, mockRes);

    // Assert - Verify selective update functionality
    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'product-id-123',
      {
        name: 'Same Name',
        description: 'Same Description',
        price: 199.99,
        category: 'same-category', 
        quantity: 25,
        shipping: false,
        slug: 'updated-product'  // Slug updated based on name (default mock value)
      },
      { new: true }
    );
    // Should not process photo when not provided
    expect(fs.default.readFileSync).not.toHaveBeenCalled();
  });

  // Should replace photo when new one provided
  test('should replace existing photo with new photo file', async () => {
    // Arrange - New photo upload
    const newImageBuffer = Buffer.from('new-photo-binary-data');
    fs.default.readFileSync.mockReturnValue(newImageBuffer);
    mockReq.files.photo = {
      path: '/tmp/new-photo.png',
      type: 'image/png',
      size: 600000
    };

    const mockProduct = { 
      photo: {},  // Will be updated with new photo
      save: jest.fn().mockResolvedValue(true) 
    };
    productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

    // Act
    await updateProductController(mockReq, mockRes);

    // Assert - Verify photo replacement functionality
    expect(fs.default.readFileSync).toHaveBeenCalledWith('/tmp/new-photo.png');
    expect(mockProduct.photo.data).toBe(newImageBuffer);
    expect(mockProduct.photo.contentType).toBe('image/png');
    expect(mockProduct.save).toHaveBeenCalled();
  });

  test('should update product without photo (optional photo update)', async () => {
    // Arrange - No photo in update request
    delete mockReq.files.photo;
    const mockUpdatedProduct = {
      _id: 'product-id-123',
      save: jest.fn().mockResolvedValue(true)
    };
    productModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Verify update without photo
    expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(fs.default.readFileSync).not.toHaveBeenCalled(); // No photo processing
    expect(mockUpdatedProduct.save).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  test('should validate required name field', async () => {
    // Arrange - Remove name from request
    delete mockReq.fields.name;

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Name is required'
    });
    expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('should validate required description field', async () => {
    // Arrange - Remove description from request
    delete mockReq.fields.description;

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

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
    await updateProductController(mockReq, mockRes);

    // Assert - Verify validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Price is required'
    });
  });

  test('should validate photo size when photo is provided', async () => {
    // Arrange - Set photo size over 1MB limit
    mockReq.files.photo.size = 1500000; // 1.5MB

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Verify size validation error
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Photo is required and must be less than 1MB'
    });
  });

  test('should handle database update errors', async () => {
    // Arrange - Mock database update failure
    const dbError = { message: 'Database update failed' };
    productModel.findByIdAndUpdate.mockRejectedValue(dbError);

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Verify error handling
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      error: dbError,
      message: 'Error updating product'
    });
  });

  // Should handle non-existent product gracefully
  test('should return 404 when product does not exist', async () => {
    // Arrange - Product ID that doesn't exist
    mockReq.params.pid = 'non-existent-product-id';
    productModel.findByIdAndUpdate.mockResolvedValue(null); // Product not found

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Should return 404 for non-existent product
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      message: 'Product not found'
    });
  });

  // Should validate price values
  test('should reject negative price values', async () => {
    // Arrange - Invalid price values
    mockReq.fields.price = -50; // Negative price

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Should reject negative prices with 400 Bad Request
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Price must be positive'
    });
  });

  // Should validate quantity values
  test('should reject negative quantity values', async () => {
    // Arrange - Invalid quantity values
    mockReq.fields.quantity = -10; // Negative quantity

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Should reject negative quantities with 400 Bad Request
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      error: 'Quantity cannot be negative'
    });
  });

  // Slug Collision Handling
  test('should handle slug collisions', async () => {
    // Arrange - Product name that creates duplicate slug
    mockReq.fields.name = 'Existing Product Name';
    slugify.mockReturnValue('existing-product-name'); // Same slug as existing product
    
    const mockProduct = {
      save: jest.fn().mockRejectedValue({
        message: 'Duplicate key error: slug already exists'
      })
    };
    productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

    // Act - Call the controller function
    await updateProductController(mockReq, mockRes);

    // Assert - Verify slug collision handling gap
    // No handling for duplicate slugs
    // Two products could have same slug, breaking URL routing
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});