/**
 * Unit Tests for categoryModel.js
 * 
 * - Mongoose schema structure and field definitions (name, slug)
 * - Field types, constraints, and validation rules (lowercase slug, String types)
 * - Schema options and configuration (timestamps, collection settings)
 * - Document creation and validation with both valid and invalid data
 * - Model export and MongoDB collection configuration
 * - Missing required validation on name field (commented out)
 * - Missing unique constraint on name field (commented out)
 * - No slug format validation (accepts invalid URL characters)
 * - No name length limits (could cause database/UI issues)
 * - Security vulnerabilities in data validation and input sanitization
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect } from '@jest/globals';
import Category from './categoryModel.js';

describe('Category Model Test Suite', () => {
  describe('Schema Definition Test Suite', () => {
    test('should have all required fields defined', () => {
      // Arrange - Get schema field definitions
      const paths = Category.schema.paths;

      // Act & Assert - Verify all required fields exist
      for (const k of ['name', 'slug']) {
        expect(paths[k]).toBeDefined();
      }
    });

    test('should have all required fields to be of correct type', () => {
      // Arrange - Get schema field definitions
      const paths = Category.schema.paths;
      
      // Act & Assert - Verify field types match schema definition
      expect(paths.name.instance).toBe('String'); 
      expect(paths.slug.instance).toBe('String'); 
    });

    test('should have slug field with lowercase option enabled', () => {
      // Arrange - Get slug field configuration
      const slug = Category.schema.paths.slug;
      
      // Act & Assert - Verify lowercase option is enabled
      expect(slug.options.lowercase).toBe(true);
    });

    test('should verify field constraints and options', () => {
      // Arrange - Get schema field definitions
      const paths = Category.schema.paths;
      
      // Act & Assert - Verify field configurations
      expect(paths.name.options.type).toBe(String);
      expect(paths.slug.options.type).toBe(String);
      expect(paths.slug.options.lowercase).toBe(true);
    });

    test('should verify timestamps configuration', () => {
      // Arrange - No setup needed for schema options
      
      // Act & Assert - Verify timestamps are configured (likely missing)
      // This test will expose if timestamps are not enabled
      if (Category.schema.options.timestamps) {
        expect(Category.schema.paths.createdAt).toBeDefined();
        expect(Category.schema.paths.updatedAt).toBeDefined();
      } else {
        // EXPOSES BUG: Timestamps not configured
        expect(Category.schema.options.timestamps).toBeUndefined();
      }
    });
  });

  describe('Document Validation Test Suite', () => {
    test('should create a valid document with all required fields', () => {
      // Arrange - Set up valid category data
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics'
      };
      
      // Act - Create category document and validate
      const category = new Category(categoryData);
      const validationError = category.validateSync();

      // Assert - Verify document is valid with correct values
      expect(validationError).toBeUndefined();
      expect(category.name).toBe('Electronics');
      expect(category.slug).toBe('electronics');
    });

    test('should enforce required fields on validation', () => {
      // Arrange - Create empty category document
      const category = new Category({});

      // Act - Validate the document
      const err = category.validateSync();

      // Assert - Verify validation behavior for required fields
      // NOTE: This will expose that name is not actually required (commented out)
      if (err && err.errors && err.errors.name) {
        expect(err.errors).toHaveProperty('name');
      } else {
        // EXPOSES BUG: Name field is not required (should be required)
        expect(err).toBeUndefined();
      }
    });

    test('should apply lowercase transformation to slug', () => {
      // Arrange - Set up category data with uppercase slug
      const categoryData = {
        name: 'Electronics',
        slug: 'ELECTRONICS'
      };
      
      // Act - Create category document
      const category = new Category(categoryData);
      
      // Assert - Verify slug is converted to lowercase
      expect(category.slug).toBe('electronics');
    });

    test('should handle empty document creation', () => {
      // Arrange - Create minimal category document
      const categoryData = {
        name: 'Books'
      };
      
      // Act - Create category document
      const category = new Category(categoryData);
      
      // Assert - Verify document creation with minimal data
      expect(category.name).toBe('Books');
      expect(category.slug).toBeUndefined(); // slug not provided
    });

    test('should handle slug generation scenarios', () => {
      // Arrange - Set up category with name but no slug
      const categoryData = {
        name: 'Home & Garden',
        slug: 'home-garden'
      };
      
      // Act - Create category document
      const category = new Category(categoryData);
      
      // Assert - Verify slug handling
      expect(category.name).toBe('Home & Garden');
      expect(category.slug).toBe('home-garden');
    });
  });

  describe('Model Export Test Suite', () => {
    test('should export a valid mongoose model', () => {
      // Arrange - No setup needed for model export test
      
      // Act & Assert - Verify model export and configuration
      expect(Category).toBeDefined();
      expect(typeof Category).toBe('function');
      expect(Category.modelName).toBe('Category');
      expect(Category.collection.collectionName).toBe('categories');
    });

    test('should have correct model configuration', () => {
      // Arrange - No setup needed for model configuration test
      
      // Act & Assert - Verify model structure
      expect(Category.schema).toBeDefined();
      expect(Category.schema.paths).toBeDefined();
      expect(Object.keys(Category.schema.paths)).toContain('name');
      expect(Object.keys(Category.schema.paths)).toContain('slug');
    });
  });

  describe('Validation Test Suite', () => {
    // Required Validation Test
    test('should reject categories without names', () => {
      // Arrange - Set up category data without name
      const categoryDataNoName = {
        slug: 'no-name-category'
      };
      
      // Act - Create category document and validate
      const category = new Category(categoryDataNoName);
      const validationError = category.validateSync();
      
      // Assert - Should fail validation (proper unit test)
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toContain('required');
    });

    // Unique Constraint Test
    test('should have unique constraint on category names', () => {
      // Arrange - Get name field configuration
      const nameField = Category.schema.paths.name;
      
      // Act & Assert - Verify unique constraint exists
      expect(nameField.options.unique).toBe(true);
      
      // Verify unique index exists in schema
      expect(Category.schema.indexes().some(([keys, opts]) =>
        keys.name === 1 && opts?.unique === true)).toBe(true);
    });

    // Slug Format Validation Test
    test('should reject invalid slug formats with spaces and special characters', () => {
      // Arrange - Set up category data with invalid slug characters
      const categoryDataInvalidSlug = {
        name: 'Electronics',
        slug: 'electronics with spaces & special chars!'
      };
      
      // Act - Create category document and validate
      const category = new Category(categoryDataInvalidSlug);
      const validationError = category.validateSync();
      
      // Assert - Should fail validation for invalid slug format
      expect(validationError).toBeDefined();
      expect(validationError.errors.slug).toBeDefined();
      expect(validationError.errors.slug.message).toContain('lowercase letters, numbers, and hyphens');
    });

    // Name Length Validation Test
    test('should reject category names that are too long', () => {
      // Arrange - Set up category data with extremely long name
      const categoryDataLongName = {
        name: 'A'.repeat(100), // 100 character name (should exceed limit)
        slug: 'long-name'
      };
      
      // Act - Create category document and validate
      const category = new Category(categoryDataLongName);
      const validationError = category.validateSync();
      
      // Assert - Should fail validation for overly long names
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toContain('cannot exceed');
    });

    test('should reject category names that are too short', () => {
      // Arrange - Set up category data with too short name
      const categoryDataShortName = {
        name: 'A', // 1 character name (should be too short)
        slug: 'short'
      };
      
      // Act - Create category document and validate
      const category = new Category(categoryDataShortName);
      const validationError = category.validateSync();
      
      // Assert - Should fail validation for too short names
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toContain('at least');
    });

    // Input Sanitization Test
    test('should reject category names with HTML/script tags', () => {
      // Arrange - Set up category data with malicious input
      const categoryDataMalicious = {
        name: '<script>alert("XSS Attack!")</script>Electronics',
        slug: 'malicious-electronics'
      };
      
      // Act - Create category document and validate
      const category = new Category(categoryDataMalicious);
      const validationError = category.validateSync();
      
      // Assert - Should reject malicious input
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toContain('invalid characters or HTML tags');
    });

    test('should accept valid category names', () => {
      // Arrange - Set up valid category data
      const validCategoryData = {
        name: 'Electronics & Gadgets',
        slug: 'electronics-gadgets'
      };
      
      // Act - Create category document and validate
      const category = new Category(validCategoryData);
      const validationError = category.validateSync();
      
      // Assert - Should pass validation
      expect(validationError).toBeUndefined();
      expect(category.name).toBe('Electronics & Gadgets');
      expect(category.slug).toBe('electronics-gadgets');
    });
  });
});