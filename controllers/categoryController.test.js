/**
 * Unit Tests for categoryController.js
 * 
 * - Controller function structure and response handling
 * - Database interaction and error handling
 * - Response status codes and message formatting
 * - Input validation and parameter processing
 * - Model integration and data retrieval
 * - Error scenarios and exception handling
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';

// Mock the category model
const mockCategoryModel = {
  find: jest.fn(),
  findOne: jest.fn()
};

// Mock the model import
jest.unstable_mockModule('../models/categoryModel.js', () => ({
  default: mockCategoryModel
}));

// Import controllers after mocking
const { categoryController, singleCategoryController } = await import('./categoryController.js');

describe('Category Controller Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock request and response objects
    mockReq = {
      params: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('categoryController Test Suite', () => {
    test('should return all categories successfully', async () => {
      // Arrange - Set up mock data and behavior
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' }
      ];
      mockCategoryModel.find.mockResolvedValue(mockCategories);

      // Act - Call the controller function
      await categoryController(mockReq, mockRes);

      // Assert - Verify correct behavior (test functionality, not exact messages)
      expect(mockCategoryModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual(mockCategories);
    });

    test('should handle database errors', async () => {
      // Arrange - Set up mock error
      const mockError = new Error('Database connection failed');
      mockCategoryModel.find.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act - Call the controller function
      await categoryController(mockReq, mockRes);

      // Assert - Verify error handling (test functionality, not exact messages)
      expect(mockCategoryModel.find).toHaveBeenCalledWith({});
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(false);
      expect(sendCall.error).toBeDefined();
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    test('should return empty array when no categories exist', async () => {
      // Arrange - Set up empty result
      mockCategoryModel.find.mockResolvedValue([]);

      // Act - Call the controller function
      await categoryController(mockReq, mockRes);

      // Assert - Verify handling of empty result (test functionality, not exact messages)
      expect(mockCategoryModel.find).toHaveBeenCalledWith({});
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual([]);
    });
  });

  describe('singleCategoryController Test Suite', () => {
    test('should return single category successfully', async () => {
      // Arrange - Set up mock data and behavior
      const mockCategory = { _id: '1', name: 'Electronics', slug: 'electronics' };
      const slug = 'electronics';
      mockReq.params.slug = slug;
      mockCategoryModel.findOne.mockResolvedValue(mockCategory);

      // Act - Call the controller function
      await singleCategoryController(mockReq, mockRes);

      // Assert - Verify correct behavior (test functionality, not exact messages)
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual(mockCategory);
    });

    test('should handle database errors', async () => {
      // Arrange - Set up mock error
      const mockError = new Error('Database query failed');
      const slug = 'electronics';
      mockReq.params.slug = slug;
      mockCategoryModel.findOne.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act - Call the controller function
      await singleCategoryController(mockReq, mockRes);

      // Assert - Verify error handling (test functionality, not exact messages)
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(false);
      expect(sendCall.error).toBeDefined();
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    test('should handle category not found scenario', async () => {
      // Arrange - Set up null result (category not found)
      const slug = 'nonexistent';
      mockReq.params.slug = slug;
      mockCategoryModel.findOne.mockResolvedValue(null);

      // Act - Call the controller function
      await singleCategoryController(mockReq, mockRes);

      // Assert - Verify handling of not found (test functionality, not exact messages)
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toBeNull();
    });

    test('should handle missing slug parameter', async () => {
      // Arrange - Set up request without slug parameter
      mockReq.params = {}; // No slug parameter
      mockCategoryModel.findOne.mockResolvedValue(null);

      // Act - Call the controller function
      await singleCategoryController(mockReq, mockRes);

      // Assert - Verify handling of missing parameter (test functionality, not exact messages)
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: undefined });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toBeNull();
    });

    test('should handle special characters in slug parameter', async () => {
      // Arrange - Set up slug with special characters
      const slug = 'electronics-&-gadgets';
      mockReq.params.slug = slug;
      const mockCategory = { _id: '1', name: 'Electronics & Gadgets', slug: slug };
      mockCategoryModel.findOne.mockResolvedValue(mockCategory);

      // Act - Call the controller function
      await singleCategoryController(mockReq, mockRes);

      // Assert - Verify handling of special characters (test functionality, not exact messages)
      expect(mockCategoryModel.findOne).toHaveBeenCalledWith({ slug: slug });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      const sendCall = mockRes.send.mock.calls[0][0];
      expect(sendCall.success).toBe(true);
      expect(typeof sendCall.message).toBe('string');
      expect(sendCall.message.length).toBeGreaterThan(0);
      expect(sendCall.category).toEqual(mockCategory);
    });
  });
});