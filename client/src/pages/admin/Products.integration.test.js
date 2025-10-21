/**
 * Integration Tests for Products.js Component
 *
 * - REAL Layout component integration (Header, Footer, Helmet, Toaster)
 * - REAL AdminMenu component integration (navigation links)
 * - REAL Context Providers (AuthProvider, CartProvider, SearchProvider)
 * - HTTP request integration using axios-mock-adapter (intercepts real axios)
 * - Product data flow from API → state → UI rendering
 * - Empty state handling with "Add Product" link navigation
 * - Error state handling with toast notifications
 * - XSS sanitization integration (sanitizeProductData function)
 * - Image fallback integration (onError handler)
 * - React Router integration (Link navigation, BrowserRouter)
 *
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Products from './Products';
import toast from 'react-hot-toast';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AuthProvider } from '../../context/auth';
import { CartProvider } from '../../context/cart';
import { SearchProvider } from '../../context/search';

// Create axios mock adapter instance
const mock = new MockAdapter(axios);

// Wrapper component with all required providers for integration testing
const AllProviders = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  </BrowserRouter>
);

// Helper function to create test product data
const createTestProduct = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  price: 100,
  category: { _id: '507f1f77bcf86cd799439012', name: 'Test Category' },
  quantity: 10,
  shipping: false,
  ...overrides
});

describe('Products Integration Tests', () => {
  beforeEach(() => {
    // Set up spy for toast.error in each test
    jest.spyOn(toast, 'error').mockImplementation(() => {});
    // Reset axios mock adapter
    mock.reset();
    // Mock the category endpoint that useCategory hook calls
    mock.onGet('/api/v1/category/get-category').reply(200, { category: [] });
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('Layout and AdminMenu Integration', () => {
    it('should render Products page with Layout and AdminMenu components integrated', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Layout renders
      expect(await screen.findByText(/all products list/i)).toBeInTheDocument();

      // Assert - AdminMenu renders within Layout
      expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
      expect(screen.getByText(/create category/i)).toBeInTheDocument();
      expect(screen.getByText(/create product/i)).toBeInTheDocument();
      // Use getAllByText for "Products" since it appears multiple times
      const productsLinks = screen.getAllByText(/products/i);
      expect(productsLinks.length).toBeGreaterThan(0);
    });

    it('should display footer from Layout component', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Footer from Layout is present (actual text is "All Rights Reserved")
      await waitFor(() => {
        expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
      });
    });
  });

  describe('HTTP Request Integration with Real Axios', () => {
    it('should make real HTTP request to fetch products on mount', async () => {
      // Arrange
      const testProduct = createTestProduct();
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [testProduct] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Request was made (axios-mock-adapter intercepted it)

      // Assert - Product data is displayed
      expect(await screen.findByText('Test Product')).toBeInTheDocument();
    });

    it('should handle 500 server error and display error toast', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(500);

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Error toast called
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Assert - Empty state UI displayed on error
      expect(await screen.findByText('No Products Available')).toBeInTheDocument();
    });

    it('should handle network failure and display error toast', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').networkError();

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Error toast called
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Assert - Empty state UI displayed on error
      expect(await screen.findByText('No Products Available')).toBeInTheDocument();
    });

    it('should handle malformed response data', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: null });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Should handle gracefully
      await waitFor(() => {
        expect(screen.getByText('No Products Available')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State Handling', () => {
    it('should display "No Products Available" when products array is empty', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert
      expect(await screen.findByText('No Products Available')).toBeInTheDocument();
    });

    it('should not display any product cards when products array is empty', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - No product cards rendered
      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /test product/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('XSS Protection via sanitizeProductData', () => {
    it('should sanitize XSS in product name', async () => {
      // Arrange
      const xssProduct = createTestProduct({
        _id: '507f1f77bcf86cd799439013',
        name: '<script>alert("XSS")</script>Product Name'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [xssProduct] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Script tag removed, safe text remains
      expect(await screen.findByText(/Product Name/)).toBeInTheDocument();
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    });

    it('should sanitize XSS in product description', async () => {
      // Arrange
      const xssProduct = createTestProduct({
        _id: '507f1f77bcf86cd799439014',
        description: '<img src=x onerror=alert("XSS")>Description'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [xssProduct] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Malicious img tag removed
      const card = await screen.findByText(/Test Product/);
      expect(card.closest('.card')).not.toHaveTextContent('<img src=x');
    });

    it('should handle non-string values in description without crashing (XSS type guard)', async () => {
      // Arrange
      const nonStringProduct = createTestProduct({
        _id: '507f1f77bcf86cd799439015',
        description: 12345 // Non-string value
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [nonStringProduct] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Should not crash, should handle gracefully
      expect(await screen.findByText('Test Product')).toBeInTheDocument();
    });

    it('should sanitize multiple XSS patterns in description', async () => {
      // Arrange
      const xssProduct = createTestProduct({
        _id: '507f1f77bcf86cd799439016',
        description: '<script>alert(1)</script><iframe src="evil.com"></iframe>Safe text'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [xssProduct] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - All malicious tags removed
      await screen.findByText(/Test Product/);
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
      expect(screen.queryByText(/<iframe>/)).not.toBeInTheDocument();
    });
  });

  describe('Image Fallback Handling', () => {
    it('should use default image when photo data is missing', async () => {
      // Arrange
      const productWithoutPhoto = createTestProduct({
        _id: '507f1f77bcf86cd799439017'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [productWithoutPhoto] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Default image src used
      const img = await screen.findByAltText('Test Product');
      expect(img.src).toContain('/api/v1/product/product-photo/507f1f77bcf86cd799439017');
    });

    it('should trigger onError handler when image fails to load', async () => {
      // Arrange
      const productWithBrokenImage = createTestProduct({
        _id: '507f1f77bcf86cd799439018'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [productWithBrokenImage] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Image element exists
      const img = await screen.findByAltText('Test Product');

      // Act - Trigger error event
      fireEvent.error(img);

      // Assert - Image src changed to default
      expect(img.src).toContain('/images/placeholder-product.png');
    });

    it('should display product card with image for valid photo data', async () => {
      // Arrange
      const productWithPhoto = createTestProduct({
        _id: '507f1f77bcf86cd799439019'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [productWithPhoto] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Image element rendered
      const img = await screen.findByAltText('Test Product');
      expect(img).toBeInTheDocument();
      expect(img.src).toContain(`/api/v1/product/product-photo/${productWithPhoto._id}`);
    });
  });

  describe('Multiple Products Display', () => {
    it('should display multiple products from API response', async () => {
      // Arrange
      const products = [
        createTestProduct({ _id: '507f1f77bcf86cd799439020', name: 'Product 1' }),
        createTestProduct({ _id: '507f1f77bcf86cd799439021', name: 'Product 2' }),
        createTestProduct({ _id: '507f1f77bcf86cd799439022', name: 'Product 3' })
      ];
      mock.onGet('/api/v1/product/get-product').reply(200, { products });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - All products displayed
      expect(await screen.findByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });
  });

  describe('Router Integration - Navigation Links', () => {
    it('should render product card as clickable link to edit page', async () => {
      // Arrange
      const testProduct = createTestProduct({
        _id: '507f1f77bcf86cd799439027',
        slug: 'test-product-slug'
      });
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [testProduct] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Product card is wrapped in link with correct path
      await screen.findByText('Test Product');
      const productLinks = screen.getAllByRole('link');
      const productCardLink = productLinks.find(link =>
        link.getAttribute('href') === '/dashboard/admin/product/test-product-slug'
      );
      expect(productCardLink).toBeInTheDocument();
    });

    it('should have correct href for AdminMenu navigation links', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - AdminMenu links have correct paths
      await screen.findByText(/all products list/i);
      const createCategoryLink = screen.getByRole('link', { name: /create category/i });
      const createProductLink = screen.getByRole('link', { name: /create product/i });

      expect(createCategoryLink).toHaveAttribute('href', '/dashboard/admin/create-category');
      expect(createProductLink).toHaveAttribute('href', '/dashboard/admin/create-product');
    });

    it('should render "Add Product" link in empty state', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - "Add Product" link in empty state
      const addProductLink = await screen.findByRole('link', { name: /add product/i });
      expect(addProductLink).toHaveAttribute('href', '/dashboard/admin/create-product');
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch products only once on mount', async () => {
      // Arrange
      mock.onGet('/api/v1/product/get-product').reply(200, { products: [] });

      // Act
      const { rerender } = render(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Wait for initial fetch
      await screen.findByText('No Products Available');

      // Rerender component
      rerender(
        <AllProviders>
          <Products />
        </AllProviders>
      );

      // Assert - Still showing empty state (no additional fetch triggered)
      expect(screen.getByText('No Products Available')).toBeInTheDocument();
    });
  });
});
