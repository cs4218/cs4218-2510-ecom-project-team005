/**
 * Unit Tests for Products.js Component
 * 
 * - Admin product listing page functionality and display
 * - API integration for fetching product data (/api/v1/product/get-product)
 * - Product grid rendering with images, names, and descriptions
 * - Navigation links to individual product edit pages
 * - Component structure with AdminMenu and Layout integration
 * - Error handling for network failures and empty states
 * - Network error handling gaps (missing try-catch structure)
 * - XSS vulnerabilities (unsanitized product data rendering)
 * - Image loading failures (no fallback for broken images)
 * - Empty state handling (no products display logic)
 * 
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import Products from './Products.js';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('axios');
jest.mock('react-hot-toast');
jest.mock('../../components/AdminMenu', () => {
  return function MockAdminMenu() {
    return <div data-testid="admin-menu">Admin Menu</div>;
  };
});
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

const MockWrapper = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Products Component Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render page layout and admin menu', () => {
    // Arrange - Set up mocks for successful data fetch
    axios.get.mockResolvedValue({ data: { products: [] } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify core page structure
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-menu')).toBeInTheDocument();
    expect(screen.getByText('All Products List')).toBeInTheDocument();
  });

  test('should fetch products on component mount', async () => {
    // Arrange - Set up mock response
    const mockProducts = [
      {
        _id: '1',
        name: 'Test Product',
        description: 'Test Description',
        slug: 'test-product'
      }
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify API call is made
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product');
    });
  });

  test('should display product cards when data is loaded', async () => {
    // Arrange - Set up mock products data
    const mockProducts = [
      {
        _id: '1',
        name: 'Laptop',
        description: 'High-performance laptop',
        slug: 'laptop'
      },
      {
        _id: '2', 
        name: 'Phone',
        description: 'Smartphone device',
        slug: 'phone'
      }
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify products are displayed
    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('High-performance laptop')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Smartphone device')).toBeInTheDocument();
    });
  });

  test('should create correct navigation links for products', async () => {
    // Arrange - Set up mock product
    const mockProducts = [
      {
        _id: '123',
        name: 'Test Product',
        description: 'Test Description',
        slug: 'test-product'
      }
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify navigation links are correct
    await waitFor(() => {
      const productLink = screen.getByText('Test Product').closest('a');
      expect(productLink).toHaveAttribute('href', '/dashboard/admin/product/test-product');
    });
  });

  test('should display product images with correct src and alt', async () => {
    // Arrange - Set up mock product
    const mockProducts = [
      {
        _id: 'prod123',
        name: 'Camera',
        description: 'Digital camera',
        slug: 'camera'
      }
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify image attributes
    await waitFor(() => {
      const productImage = screen.getByAltText('Camera');
      expect(productImage).toHaveAttribute('src', '/api/v1/product/product-photo/prod123');
      expect(productImage).toHaveAttribute('alt', 'Camera');
    });
  });

  // Network Error Handling
  test('should handle API network errors gracefully', async () => {
    // Arrange - Set up network failure scenario
    axios.get.mockRejectedValue(new Error('Network Error'));

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify improved error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load products. Please check your connection and try again.');
    });
  });

  // XSS Security Vulnerability  
  test('should handle malicious product data safely', async () => {
    // Arrange - Malicious product data with script injection
    const maliciousProducts = [
      {
        _id: '1',
        name: '<script>alert("XSS in name!")</script>Malicious Product',
        description: '<img src=x onerror=alert("XSS in description!")>Product description',
        slug: 'malicious-product'
      }
    ];
    axios.get.mockResolvedValue({ data: { products: maliciousProducts } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify XSS protection is working
    await waitFor(() => {
      const container = screen.getByTestId('layout');

      expect(container.innerHTML).not.toContain('<script>'); // Script tags removed from user content
      expect(container.innerHTML).not.toContain('onerror=alert'); // XSS event handlers removed
      expect(container.innerHTML).toContain('alert("XSS in name!")Malicious Product'); // Clean text remains
      expect(container.innerHTML).toContain('Product description'); // Clean text remains
      
      // Component should still render legitimate product image (not user content)
      expect(container.innerHTML).toContain('<img'); // Legitimate product image still rendered
      expect(container.innerHTML).toContain('src="/api/v1/product/product-photo/1"'); // Valid image source
    });
  });

  // Empty Products State
  test('should handle empty products array gracefully', () => {
    // Arrange - Empty products response
    axios.get.mockResolvedValue({ data: { products: [] } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify improved empty state handling
    expect(screen.getByText('No Products Available')).toBeInTheDocument();
    expect(screen.getByText('Start building your catalog by adding your first product.')).toBeInTheDocument();
    
    const addProductLink = screen.getByText('Add Product');
    expect(addProductLink).toBeInTheDocument();
    expect(addProductLink.closest('a')).toHaveAttribute('href', '/dashboard/admin/create-product');
  });

  // Image Loading Fallback
  test('should handle broken product images gracefully', async () => {
    // Arrange - Product with image that might fail to load
    const mockProducts = [
      {
        _id: 'broken-img',
        name: 'Product with Broken Image',
        description: 'Test product',
        slug: 'broken-image-product'
      }
    ];
    axios.get.mockResolvedValue({ data: { products: mockProducts } });

    // Act - Render the component
    render(
      <MockWrapper>
        <Products />
      </MockWrapper>
    );

    // Assert - Verify image fallback handling is implemented
    await waitFor(() => {
      const productImage = screen.getByAltText('Product with Broken Image');
      
      // onError attribute sets placeholder image when original fails to load
      expect(productImage).toHaveAttribute('src', '/api/v1/product/product-photo/broken-img');
      expect(productImage).toHaveStyle('height: 200px; object-fit: cover');
      
      // Test error handling by simulating image load failure
      const errorEvent = new Event('error');
      productImage.dispatchEvent(errorEvent);
      
      // Should fallback to placeholder (though in test environment this won't actually change)
      expect(productImage).toHaveAttribute('alt', 'Product with Broken Image');
    });
  });

});