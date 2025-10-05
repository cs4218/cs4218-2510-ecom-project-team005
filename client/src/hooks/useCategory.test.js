/**
 * Unit Tests for useCategory.js hook
 * 
 * - React hook functionality and state management
 * - API calls and data fetching with axios
 * - useEffect lifecycle and dependency handling  
 * - Error handling and console logging
 * - State updates and return values
 * - Component integration and data flow
 * 
 * AI was utilized in the making of this file
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';

// Mock axios before importing the hook
jest.mock('axios', () => ({
  get: jest.fn()
}));

import axios from 'axios';
import useCategory from './useCategory';

const mockAxios = axios;

describe('useCategory Hook Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Hook Initialization Test Suite', () => {
    test('should initialize with empty categories array', () => {
      // Arrange - Set up successful API response
      mockAxios.get.mockResolvedValue({
        data: { category: [] }
      });

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Verify initial state
      expect(result.current).toEqual([]);
    });

    test('should call API on mount', async () => {
      // Arrange - Set up API response
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' }
      ];
      mockAxios.get.mockResolvedValue({
        data: { category: mockCategories }
      });

      // Act - Render the hook
      renderHook(() => useCategory());

      // Assert - Verify API call
      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Fetching Test Suite', () => {
    test('should update categories state with API data', async () => {
      // Arrange - Set up API response
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' }
      ];
      mockAxios.get.mockResolvedValue({
        data: { category: mockCategories }
      });

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for state update
      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
      });
    });

    test('should handle empty category response', async () => {
      // Arrange - Set up empty API response
      mockAxios.get.mockResolvedValue({
        data: { category: [] }
      });

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for state update
      await waitFor(() => {
        expect(result.current).toEqual([]);
      });
    });

    test('should handle undefined category data', async () => {
      // Arrange - Set up undefined category response
      mockAxios.get.mockResolvedValue({
        data: { category: undefined }
      });

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for state update
      await waitFor(() => {
        expect(result.current).toBeUndefined();
      });
    });

    test('should handle malformed API response', async () => {
      // Arrange - Set up malformed response
      mockAxios.get.mockResolvedValue({
        data: null
      });

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for state update
      await waitFor(() => {
        expect(result.current).toBeUndefined();
      });
    });
  });

  describe('Error Handling Test Suite', () => {
    test('should handle API errors gracefully', async () => {
      // Arrange - Set up API error
      const mockError = new Error('Network Error');
      mockAxios.get.mockRejectedValue(mockError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(mockError);
      });
      
      // Categories should remain empty array on error
      expect(result.current).toEqual([]);

      consoleSpy.mockRestore();
    });

    test('should handle network timeout errors', async () => {
      // Arrange - Set up timeout error
      const timeoutError = new Error('timeout of 5000ms exceeded');
      mockAxios.get.mockRejectedValue(timeoutError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(timeoutError);
      });
      
      expect(result.current).toEqual([]);
      consoleSpy.mockRestore();
    });

    test('should handle 404 API errors', async () => {
      // Arrange - Set up 404 error
      const notFoundError = {
        response: { status: 404, data: { message: 'Not Found' } }
      };
      mockAxios.get.mockRejectedValue(notFoundError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act - Render the hook
      const { result } = renderHook(() => useCategory());

      // Assert - Wait for error handling
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(notFoundError);
      });

      expect(result.current).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('Hook Lifecycle Test Suite', () => {
    test('should only call API once on initial render', async () => {
      // Arrange - Set up API response
      mockAxios.get.mockResolvedValue({
        data: { category: [] }
      });

      // Act - Render the hook
      const { rerender } = renderHook(() => useCategory());

      // Wait for initial call
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      });

      // Rerender the hook
      rerender();

      // Assert - Should not call API again
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    test('should return consistent reference for same data', async () => {
      // Arrange - Set up API response
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' }
      ];
      mockAxios.get.mockResolvedValue({
        data: { category: mockCategories }
      });

      // Act - Render the hook
      const { result, rerender } = renderHook(() => useCategory());

      // Wait for initial data
      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
      });

      const firstResult = result.current;

      // Rerender
      rerender();

      // Assert - Reference should be the same
      expect(result.current).toBe(firstResult);
    });
  });
});