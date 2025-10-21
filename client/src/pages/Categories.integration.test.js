/**
 * Integration Tests for Categories.js Component
 *
 * - REAL Layout component integration (Header, Footer, Helmet, Toaster)
 * - REAL useCategory hook integration (custom hook with axios)
 * - REAL Context Providers (AuthProvider, CartProvider, SearchProvider)
 * - HTTP request integration using axios-mock-adapter (intercepts real axios)
 * - Category data flow from API → useCategory hook → Categories component → UI rendering
 * - Empty state handling with "No categories available" message
 * - Error state handling (network failures)
 * - React Router integration (Link navigation to category pages, BrowserRouter)
 * - Multiple categories display and navigation links
 *
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Categories from './Categories';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AuthProvider } from '../context/auth';
import { CartProvider } from '../context/cart';
import { SearchProvider } from '../context/search';

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

// Helper function to create test category data
const createTestCategory = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Category',
  slug: 'test-category',
  ...overrides
});

describe('Categories Integration Tests', () => {
  beforeEach(() => {
    // Reset axios mock adapter
    mock.reset();
  });

  afterEach(() => {
    // Restore all mocks after each test
    jest.restoreAllMocks();
  });

  describe('Layout Integration', () => {
    it('should render Categories page with Layout component integrated', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [] });

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Layout renders with title
      expect(await screen.findByText(/all categories/i)).toBeInTheDocument();

      // Assert - Footer from Layout is present
      await waitFor(() => {
        expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
      });
    });
  });

  describe('useCategory Hook Integration - Real HTTP Requests', () => {
    it('should use REAL useCategory hook to fetch categories from API', async () => {
      // Arrange
      const testCategory = createTestCategory({ name: 'Electronics', slug: 'electronics' });
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [testCategory] });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - useCategory hook makes real axios call (intercepted by mock adapter)
      // Assert - Category data is displayed in main content
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Electronics');
      });
    });

    it('should fetch multiple categories via useCategory hook', async () => {
      // Arrange
      const categories = [
        createTestCategory({ _id: '1', name: 'Electronics', slug: 'electronics' }),
        createTestCategory({ _id: '2', name: 'Books', slug: 'books' }),
        createTestCategory({ _id: '3', name: 'Clothing', slug: 'clothing' })
      ];
      mock.onGet('/api/v1/category/get-category').reply(200, { category: categories });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - All categories displayed in main content
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Electronics');
        expect(mainContent).toHaveTextContent('Books');
        expect(mainContent).toHaveTextContent('Clothing');
      });
    });

    it('should handle network error from useCategory hook gracefully', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').networkError();

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Empty state displayed (hook returns empty array on error)
      expect(await screen.findByTestId('no-categories')).toBeInTheDocument();
      expect(screen.getByText(/no categories available/i)).toBeInTheDocument();
    });

    it('should handle 500 server error from useCategory hook', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').reply(500);

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Empty state displayed
      expect(await screen.findByTestId('no-categories')).toBeInTheDocument();
    });

    it('should handle malformed response data from API', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').reply(200, { category: null });

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Should handle gracefully with empty state
      await waitFor(() => {
        expect(screen.getByTestId('no-categories')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State Handling', () => {
    it('should display "No categories available" when categories array is empty', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [] });

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert
      expect(await screen.findByTestId('no-categories')).toBeInTheDocument();
      expect(screen.getByText(/no categories available at the moment/i)).toBeInTheDocument();
    });

    it('should not display any category buttons when categories array is empty', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [] });

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - No category links rendered
      await waitFor(() => {
        const categoryLinks = screen.queryAllByRole('link').filter(link =>
          link.getAttribute('href')?.startsWith('/category/')
        );
        expect(categoryLinks.length).toBe(0);
      });
    });
  });

  describe('Router Integration - Category Navigation Links', () => {
    it('should render category as clickable link with correct href', async () => {
      // Arrange
      const testCategory = createTestCategory({ name: 'Electronics', slug: 'electronics' });
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [testCategory] });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Category link has correct path (filter for .btn class to get main content link)
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Electronics');
      });

      const categoryLinks = screen.getAllByRole('link', { name: /electronics/i });
      const mainContentLink = categoryLinks.find(link => link.classList.contains('btn'));
      expect(mainContentLink).toHaveAttribute('href', '/category/electronics');
    });

    it('should render multiple category links with unique slugs', async () => {
      // Arrange
      const categories = [
        createTestCategory({ _id: '1', name: 'Electronics', slug: 'electronics' }),
        createTestCategory({ _id: '2', name: 'Books', slug: 'books' }),
        createTestCategory({ _id: '3', name: 'Home & Garden', slug: 'home-garden' })
      ];
      mock.onGet('/api/v1/category/get-category').reply(200, { category: categories });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - All category links have correct paths
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Electronics');
      });

      // Get all links and filter for main content links (with .btn class)
      const electronicsLinks = screen.getAllByRole('link', { name: /electronics/i });
      const booksLinks = screen.getAllByRole('link', { name: /books/i });
      const homeGardenLinks = screen.getAllByRole('link', { name: /home & garden/i });

      const electronicsLink = electronicsLinks.find(link => link.classList.contains('btn'));
      const booksLink = booksLinks.find(link => link.classList.contains('btn'));
      const homeGardenLink = homeGardenLinks.find(link => link.classList.contains('btn'));

      expect(electronicsLink).toHaveAttribute('href', '/category/electronics');
      expect(booksLink).toHaveAttribute('href', '/category/books');
      expect(homeGardenLink).toHaveAttribute('href', '/category/home-garden');
    });

    it('should use category slug for navigation, not name', async () => {
      // Arrange
      const testCategory = createTestCategory({
        name: 'Home & Garden',
        slug: 'home-garden' // slug is URL-friendly
      });
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [testCategory] });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Link uses slug, not name
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Home & Garden');
      });

      const categoryLinks = screen.getAllByRole('link', { name: /home & garden/i });
      const categoryLink = categoryLinks.find(link => link.classList.contains('btn'));

      expect(categoryLink).toHaveAttribute('href', '/category/home-garden');
      expect(categoryLink).not.toHaveAttribute('href', '/category/Home & Garden');
    });
  });

  describe('CSS Classes and Styling Integration', () => {
    it('should apply correct Bootstrap classes to category buttons', async () => {
      // Arrange
      const testCategory = createTestCategory({ name: 'Electronics', slug: 'electronics' });
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [testCategory] });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Category link has btn and btn-primary classes
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Electronics');
      });

      const categoryLinks = screen.getAllByRole('link', { name: /electronics/i });
      const categoryLink = categoryLinks.find(link => link.classList.contains('btn'));

      expect(categoryLink).toHaveClass('btn', 'btn-primary');
    });

    it('should render categories in grid layout with correct column classes', async () => {
      // Arrange
      const categories = [
        createTestCategory({ _id: '1', name: 'Cat1', slug: 'cat1' }),
        createTestCategory({ _id: '2', name: 'Cat2', slug: 'cat2' })
      ];
      mock.onGet('/api/v1/category/get-category').reply(200, { category: categories });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Categories rendered in grid columns
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Cat1');
      });
      const columns = container.querySelectorAll('.col-md-6');
      expect(columns.length).toBe(2);
    });
  });

  describe('Multiple Categories Display', () => {
    it('should display large number of categories', async () => {
      // Arrange - Create 20 categories
      const categories = [];
      for (let i = 1; i <= 20; i++) {
        categories.push(createTestCategory({
          _id: `cat-${i}`,
          name: `Category ${i}`,
          slug: `category-${i}`
        }));
      }
      mock.onGet('/api/v1/category/get-category').reply(200, { category: categories });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - All 20 categories displayed in main content
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Category 1');
        expect(mainContent).toHaveTextContent('Category 10');
        expect(mainContent).toHaveTextContent('Category 20');
      });

      // Assert - All links rendered in main content (with .btn class)
      const categoryLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href')?.startsWith('/category/') && link.classList.contains('btn')
      );
      expect(categoryLinks.length).toBe(20);
    });

    it('should preserve category order from API response', async () => {
      // Arrange
      const categories = [
        createTestCategory({ _id: '1', name: 'Zebra', slug: 'zebra' }),
        createTestCategory({ _id: '2', name: 'Apple', slug: 'apple' }),
        createTestCategory({ _id: '3', name: 'Mango', slug: 'mango' })
      ];
      mock.onGet('/api/v1/category/get-category').reply(200, { category: categories });

      // Act
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Categories displayed in API order (not alphabetical)
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Zebra');
      });

      // Filter to get only main content category links (have .btn class)
      const categoryLinks = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href')?.startsWith('/category/') && link.classList.contains('btn')
      );

      expect(categoryLinks[0]).toHaveTextContent('Zebra');
      expect(categoryLinks[1]).toHaveTextContent('Apple');
      expect(categoryLinks[2]).toHaveTextContent('Mango');
    });
  });

  describe('Component Lifecycle - useCategory Hook Integration', () => {
    it('should fetch categories only once on mount via useCategory hook', async () => {
      // Arrange
      const categories = [createTestCategory({ name: 'Electronics', slug: 'electronics' })];
      mock.onGet('/api/v1/category/get-category').reply(200, { category: categories });

      // Act
      const { rerender, container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Wait for category to appear in main content (not header dropdown)
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Electronics');
      });

      // Get initial request count
      const initialRequestCount = mock.history.get.length;

      // Rerender component
      rerender(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - No additional fetch triggered (useEffect has empty dependency array)
      expect(mock.history.get.length).toBe(initialRequestCount);
    });
  });

  describe('Data Flow Integration - API → useCategory → Categories → UI', () => {
    it('should integrate full data flow from API to UI rendering', async () => {
      // Arrange - API returns category data
      const apiCategory = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Electronics',
        slug: 'test-electronics'
      };
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [apiCategory] });

      // Act - Render Categories component
      const { container } = render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Data flows through entire stack:
      // 1. useCategory hook calls axios.get('/api/v1/category/get-category')
      // 2. Mock adapter intercepts and returns apiCategory
      // 3. useCategory updates state with data.category
      // 4. Categories component receives categories from useCategory
      // 5. UI renders category name and slug in Link

      // Find the category link in the main content area (not header dropdown)
      await waitFor(() => {
        const mainContent = container.querySelector('.container .row');
        expect(mainContent).toHaveTextContent('Test Electronics');
      });

      // Get all category links and find the one in main content (has btn class)
      const categoryLinks = screen.getAllByRole('link', { name: /test electronics/i });
      const mainContentLink = categoryLinks.find(link => link.classList.contains('btn'));

      expect(mainContentLink).toHaveTextContent('Test Electronics');
      expect(mainContentLink).toHaveAttribute('href', '/category/test-electronics');
    });

    it('should verify axios request URL matches useCategory implementation', async () => {
      // Arrange
      mock.onGet('/api/v1/category/get-category').reply(200, { category: [] });

      // Act
      render(
        <AllProviders>
          <Categories />
        </AllProviders>
      );

      // Assert - Verify exact API endpoint called by useCategory hook
      // NOTE: The endpoint is called TWICE - once by Header component, once by Categories page
      // Both use the REAL useCategory hook (this is integration testing!)
      await waitFor(() => {
        expect(mock.history.get.length).toBeGreaterThanOrEqual(1);
        const categoryRequests = mock.history.get.filter(req => req.url === '/api/v1/category/get-category');
        expect(categoryRequests.length).toBeGreaterThanOrEqual(1);
        expect(categoryRequests[0].url).toBe('/api/v1/category/get-category');
      });
    });
  });
});