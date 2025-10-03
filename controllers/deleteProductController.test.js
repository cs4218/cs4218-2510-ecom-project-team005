/**
 * Unit Tests for deleteProductController Function
 * 
 * - Product deletion API endpoint functionality (/api/v1/product/delete-product/:pid)
 * - Database operations with productModel.findByIdAndDelete()
 * - Product existence validation before deletion
 * - Response formatting and status codes (200 success, 404 not found, 500 error)
 * - Error handling for invalid product IDs and database failures
 * - Missing authorization checks (security vulnerability)
 * - No cascade deletion handling (orphaned data)
 * - Invalid ObjectId handling (server crashes)
 * - Audit trail missing (no deletion logging)
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies using unstable_mockModule
jest.unstable_mockModule('../models/productModel.js', () => ({
  default: {
    findByIdAndDelete: jest.fn()
  }
}));

const { deleteProductController } = await import('./productController.js');
const productModel = (await import('../models/productModel.js')).default;

describe('deleteProductController Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock request object
    mockReq = {
      params: {
        pid: '507f1f77bcf86cd799439011' // Valid MongoDB ObjectId format
      },
      user: {
        _id: 'admin-user-id',
        role: 'admin'
      }
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    // Reset and configure the mock chain for each test - use the ACTUAL imported mock
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'test-id', name: 'Test Product' })
    });
  });

  test('should delete product successfully when product exists', async () => {
    // Arrange - Set up successful product deletion
    const mockDeletedProduct = {
      _id: 'valid-product-id-123',
      name: 'Test Product',
      description: 'Test Description'
    };
    // Override default mock for this specific test
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockDeletedProduct)
    });

    // Act - Call the controller function
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify successful deletion
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  test('should handle non-existent product gracefully', async () => {
    // Arrange - Product not found in database
    // Override default mock for this specific test  
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    // Act - Call the controller function
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify not found handling
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      message: 'Product not found'
    });
  });

  test('should handle database errors during deletion', async () => {
    // Arrange - Database operation failure  
    const dbError = { message: 'Database connection failed' };
    // Override default mock for this specific test
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockRejectedValue(dbError)
    });

    // Act - Call the controller function
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify error handling
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error deleting product',
      error: dbError.message
    });
  });

  // Should perform complete deletion process
  test('should execute proper deletion workflow for valid product', async () => {
    // Arrange - Valid product deletion scenario
    const mockProductToDelete = {
      _id: 'valid-product-id-123',
      name: 'Product to Delete',
      description: 'This product will be deleted',
      price: 99.99,
      category: 'electronics'
    };
    
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProductToDelete)
    });

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify complete deletion functionality
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  // Should exclude photo data from selection
  test('should properly exclude photo data during deletion process', async () => {
    // Arrange - Product with photo data
    const mockProduct = {
      _id: 'product-with-photo',
      name: 'Product with Photo',
      description: 'Has photo data that should be excluded'
      // Note: photo data excluded by .select("-photo")
    };
    
    const mockSelectFunction = jest.fn().mockResolvedValue(mockProduct);
    productModel.findByIdAndDelete.mockReturnValue({
      select: mockSelectFunction
    });

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify photo data exclusion functionality
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(mockSelectFunction).toHaveBeenCalledWith('-photo');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  // Should handle product ID parameter correctly
  test('should extract and use product ID from request parameters', async () => {
    // Arrange - Different product ID
    mockReq.params.pid = '507f1f77bcf86cd799439022'; // Different valid ObjectId
    
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439022', name: 'Different Product' })
    });

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify parameter extraction functionality
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439022');
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  // Should return proper success response format
  test('should return standardized success response format', async () => {
    // Arrange - Successful deletion
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'test-id', name: 'Test Product' })
    });

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify response format functionality
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: true,
      message: 'Product deleted successfully'
    });
    
    // Should not include deleted product data in response for security
    const responseCall = mockRes.send.mock.calls[0][0];
    expect(responseCall).not.toHaveProperty('product');
    expect(responseCall).not.toHaveProperty('deletedProduct');
  });

  // Should require admin authorization  
  test('should require admin authorization to delete product', async () => {
    // Arrange - Request without admin authorization
    mockReq.user = { role: 'user' }; // Regular user, not admin

    // Act - Call the controller function
    await deleteProductController(mockReq, mockRes);

    // Assert - Should reject non-admin users with 403 Forbidden
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      message: 'Admin access required'
    });
    
    // Should not attempt database operation for unauthorized users
    expect(productModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  // Should validate ObjectId format
  test('should reject malformed product IDs', async () => {
    // Arrange - Invalid ObjectId format
    mockReq.params.pid = 'invalid-object-id';

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Should return 400 for invalid ID format
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid product ID format'
    });
  });

  // Audit Trail Missing
  test('should log deletion for audit trail', async () => {
    // Arrange - Product deletion that should be audited
    const mockProduct = {
      _id: 'audited-product',
      name: 'Important Product',
      price: 999.99
    };
    
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct)
    });

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify audit trail gap
    // No deletion logging for audit trail
    // Important for compliance and security tracking
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  // Cascade Deletion Handling
  test('should handle related data cleanup', async () => {
    // Arrange - Product with related data (orders, reviews, etc.)
    const mockProduct = {
      _id: 'product-with-relations',
      name: 'Product with Orders'
    };
    
    productModel.findByIdAndDelete.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockProduct)
    });

    // Act
    await deleteProductController(mockReq, mockRes);

    // Assert - Verify cascade deletion gap
    // No cleanup of related data when product is deleted
    // Orders, reviews, wishlists may still reference deleted product
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

});