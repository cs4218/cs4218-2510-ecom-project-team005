/**
 * Unit Tests for Categories.js page component
 * 
 * - React component rendering and structure
 * - Hook integration and data consumption
 * - React Router Link navigation
 * - Bootstrap CSS classes and layout
 * - Dynamic content rendering based on data
 * - Component props and Layout integration
 * 
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';

// Mock all dependencies before importing the component
jest.mock('../hooks/useCategory', () => jest.fn());
jest.mock('../components/Layout', () => ({ title, children }) => (
  <div data-testid="layout" data-title={title}>
    <main className="container">
      {children}
    </main>
  </div>
));

import useCategory from '../hooks/useCategory';
import Categories from './Categories';

const mockUseCategory = useCategory;

// Wrapper component for React Router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Categories Page Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering Test Suite', () => {
    test('should render with empty categories', () => {
      // Arrange - Set up empty categories
      mockUseCategory.mockReturnValue([]);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify basic structure
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('layout')).toHaveAttribute('data-title', 'All Categories');
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('should render Layout with correct title', () => {
      // Arrange - Set up mock data
      mockUseCategory.mockReturnValue([]);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify Layout props
      const layout = screen.getByTestId('layout');
      expect(layout).toHaveAttribute('data-title', 'All Categories');
    });

    test('should render container with Bootstrap classes', () => {
      // Arrange - Set up mock data
      mockUseCategory.mockReturnValue([]);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify Bootstrap structure
      expect(screen.getByRole('main')).toHaveClass('container');
      const row = screen.getByRole('main').querySelector('.row');
      expect(row).toBeInTheDocument();
    });
  });

  describe('Categories Display Test Suite', () => {
    test('should render single category correctly', () => {
      // Arrange - Set up single category
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify category rendering
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/category/electronics');
      expect(screen.getByRole('link')).toHaveClass('btn', 'btn-primary');
    });

    test('should render multiple categories correctly', () => {
      // Arrange - Set up multiple categories
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' },
        { _id: '3', name: 'Clothing', slug: 'clothing' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify all categories are rendered
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(screen.getByText('Clothing')).toBeInTheDocument();
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
      expect(links[0]).toHaveAttribute('href', '/category/electronics');
      expect(links[1]).toHaveAttribute('href', '/category/books');
      expect(links[2]).toHaveAttribute('href', '/category/clothing');
    });

    test('should apply correct Bootstrap grid classes', () => {
      // Arrange - Set up categories
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books', slug: 'books' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify grid classes
      const categoryItems = screen.getByRole('main').querySelectorAll('.col-md-6');
      expect(categoryItems).toHaveLength(2);
      
      categoryItems.forEach(item => {
        expect(item).toHaveClass('col-md-6', 'mt-5', 'mb-3', 'gx-3', 'gy-3');
      });
    });
  });

  describe('Hook Integration Test Suite', () => {
    test('should call useCategory hook', () => {
      // Arrange - Set up mock return value
      mockUseCategory.mockReturnValue([]);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify hook was called
      expect(mockUseCategory).toHaveBeenCalledTimes(1);
    });

    test('should handle undefined categories from hook', () => {
      // Arrange - Set up undefined return value
      mockUseCategory.mockReturnValue(undefined);

      // Act & Assert - Should render without crashing
      expect(() => {
        render(
          <RouterWrapper>
            <Categories />
          </RouterWrapper>
        );
      }).not.toThrow();
      
      // Should render layout but no category items
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    test('should handle null categories from hook', () => {
      // Arrange - Set up null return value
      mockUseCategory.mockReturnValue(null);

      // Act & Assert - Should render without crashing
      expect(() => {
        render(
          <RouterWrapper>
            <Categories />
          </RouterWrapper>
        );
      }).not.toThrow();
      
      // Should render layout but no category items
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  describe('Navigation Test Suite', () => {
    test('should generate correct category URLs', () => {
      // Arrange - Set up categories with special characters
      const mockCategories = [
        { _id: '1', name: 'Electronics & Gadgets', slug: 'electronics-gadgets' },
        { _id: '2', name: 'Home & Garden', slug: 'home-garden' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify URL generation
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', '/category/electronics-gadgets');
      expect(links[1]).toHaveAttribute('href', '/category/home-garden');
    });

    test('should handle empty slug values', () => {
      // Arrange - Set up category with empty slug
      const mockCategories = [
        { _id: '1', name: 'Test Category', slug: '' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify link still renders
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/category/');
      expect(link).toHaveTextContent('Test Category');
    });
  });

  describe('Accessibility Test Suite', () => {
    test('should have proper semantic structure', () => {
      // Arrange - Set up categories
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify semantic elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    test('should have accessible link text', () => {
      // Arrange - Set up categories
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Books & Media', slug: 'books-media' }
      ];
      mockUseCategory.mockReturnValue(mockCategories);

      // Act - Render component
      render(
        <RouterWrapper>
          <Categories />
        </RouterWrapper>
      );

      // Assert - Verify accessible link text
      expect(screen.getByRole('link', { name: 'Electronics' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Books & Media' })).toBeInTheDocument();
    });
  });
});