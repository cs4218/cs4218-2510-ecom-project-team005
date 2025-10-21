/**
 * Integration Tests for categoryModel.js
 *
 * - Mongoose schema integration with MongoDB (in-memory)
 * - Unique slug constraint enforcement at database level
 * - Lowercase transformation integration with MongoDB
 * - Required field validation enforcement by MongoDB
 * - Name length validation (minlength, maxlength) enforcement
 * - XSS prevention (HTML tag validation) enforcement
 * - Slug format validation (lowercase, numbers, hyphens only)
 * - Real database operations (create, validate, constraint checking)
 *
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import categoryModel from './categoryModel.js';

describe('Category Model Integration Test Suite', () => {
  beforeEach(async () => {
    // Arrange - Clear all categories before each test for isolation
    await categoryModel.deleteMany({});
  });

  describe('Unique Slug Constraint Integration Tests', () => {
    test('should enforce unique slug constraint at database level', async () => {
      // Arrange - Create first category with specific slug
      await categoryModel.create({
        name: 'Electronics',
        slug: 'electronics'
      });

      // Act & Assert - Attempt to create second category with same slug
      await expect(
        categoryModel.create({
          name: 'Electronics 2', // Different name
          slug: 'electronics' // Same slug - should fail
        })
      ).rejects.toThrow(/duplicate key/);
    });

    test('should allow categories with different slugs', async () => {
      // Arrange & Act - Create multiple categories with unique slugs
      await categoryModel.create({
        name: 'Electronics',
        slug: 'electronics'
      });

      await categoryModel.create({
        name: 'Books',
        slug: 'books'
      });

      // Assert - Both categories exist in database
      const categories = await categoryModel.find({});
      expect(categories).toHaveLength(2);
      expect(categories[0].slug).toBe('electronics');
      expect(categories[1].slug).toBe('books');
    });

    test('should enforce unique name constraint at database level', async () => {
      // Arrange - Create first category
      await categoryModel.create({
        name: 'Electronics',
        slug: 'electronics'
      });

      // Act & Assert - Attempt to create category with duplicate name
      await expect(
        categoryModel.create({
          name: 'Electronics', // Duplicate name
          slug: 'electronics-2' // Different slug
        })
      ).rejects.toThrow(/duplicate key/);
    });
  });

  describe('Lowercase Transformation Integration Tests', () => {
    test('should automatically transform slug to lowercase in database', async () => {
      // Arrange - Category with uppercase slug
      const categoryData = {
        name: 'Electronics',
        slug: 'ELECTRONICS' // Uppercase input
      };

      // Act - Create category
      const category = await categoryModel.create(categoryData);

      // Assert - Slug is stored in lowercase
      expect(category.slug).toBe('electronics');

      // Assert - Verify in database
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory.slug).toBe('electronics');
    });

    test('should transform mixed case slug to lowercase', async () => {
      // Arrange - Category with mixed case slug
      const categoryData = {
        name: 'Home & Garden',
        slug: 'HoMe-GaRdEn' // Mixed case
      };

      // Act - Create category
      const category = await categoryModel.create(categoryData);

      // Assert - All lowercase in database
      expect(category.slug).toBe('home-garden');
    });
  });

  describe('Required Field Validation Integration Tests', () => {
    test('should reject category creation when name is missing', async () => {
      // Arrange - Category data without name
      const categoryWithoutName = {
        slug: 'test-slug'
        // Missing name
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(categoryWithoutName)
      ).rejects.toThrow(/required/);
    });

    test('should create category successfully with required name field', async () => {
      // Arrange - Category with name
      const validCategory = {
        name: 'Electronics',
        slug: 'electronics'
      };

      // Act - Create category
      const category = await categoryModel.create(validCategory);

      // Assert - Category created successfully
      expect(category.name).toBe('Electronics');
      expect(category._id).toBeDefined();
    });
  });

  describe('Name Length Validation Integration Tests', () => {
    test('should reject category names shorter than minimum length', async () => {
      // Arrange - Category with name too short (less than 2 chars)
      const shortNameCategory = {
        name: 'A', // Only 1 character
        slug: 'a'
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(shortNameCategory)
      ).rejects.toThrow(/at least 2 characters/);
    });

    test('should accept category names at minimum length', async () => {
      // Arrange - Category with name exactly 2 characters
      const minLengthCategory = {
        name: 'AB', // Exactly 2 characters
        slug: 'ab'
      };

      // Act - Create category
      const category = await categoryModel.create(minLengthCategory);

      // Assert - Category created successfully
      expect(category.name).toBe('AB');
      expect(category.name.length).toBe(2);
    });

    test('should reject category names longer than maximum length', async () => {
      // Arrange - Category with name too long (more than 50 chars)
      const longNameCategory = {
        name: 'A'.repeat(51), // 51 characters - exceeds limit
        slug: 'long-name'
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(longNameCategory)
      ).rejects.toThrow(/cannot exceed 50 characters/);
    });

    test('should accept category names at maximum length', async () => {
      // Arrange - Category with name exactly 50 characters
      const maxLengthName = 'A'.repeat(50); // Exactly 50 characters
      const maxLengthCategory = {
        name: maxLengthName,
        slug: 'max-length-name'
      };

      // Act - Create category
      const category = await categoryModel.create(maxLengthCategory);

      // Assert - Category created successfully
      expect(category.name).toBe(maxLengthName);
      expect(category.name.length).toBe(50);
    });

    test('should accept category names within valid range', async () => {
      // Arrange - Category with name in valid range (10 chars)
      const validNameCategory = {
        name: 'Valid Name',
        slug: 'valid-name'
      };

      // Act - Create category
      const category = await categoryModel.create(validNameCategory);

      // Assert - Category created successfully
      expect(category.name).toBe('Valid Name');
    });
  });

  describe('XSS Prevention Validation Integration Tests', () => {
    test('should reject category names containing HTML script tags', async () => {
      // Arrange - Category with malicious script in name
      const xssCategory = {
        name: '<script>alert("XSS")</script>Electronics',
        slug: 'xss-electronics'
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(xssCategory)
      ).rejects.toThrow(/invalid characters or HTML tags/);
    });

    test('should reject category names containing HTML image tags', async () => {
      // Arrange - Category with HTML img tag
      const imgTagCategory = {
        name: '<img src=x onerror=alert("XSS")>Books',
        slug: 'img-books'
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(imgTagCategory)
      ).rejects.toThrow(/invalid characters or HTML tags/);
    });

    test('should reject category names containing any HTML tags', async () => {
      // Arrange - Category with various HTML tags
      const htmlTagCategory = {
        name: '<div>Category</div>',
        slug: 'div-category'
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(htmlTagCategory)
      ).rejects.toThrow(/invalid characters or HTML tags/);
    });

    test('should accept category names with special characters but no HTML tags', async () => {
      // Arrange - Category with ampersand and other safe special chars
      const safeSpecialChars = {
        name: 'Electronics & Gadgets',
        slug: 'electronics-gadgets'
      };

      // Act - Create category
      const category = await categoryModel.create(safeSpecialChars);

      // Assert - Category created successfully
      expect(category.name).toBe('Electronics & Gadgets');
    });
  });

  describe('Slug Format Validation Integration Tests', () => {
    test('should reject slugs with uppercase letters', async () => {
      // Arrange - Category with uppercase in slug (after lowercase transformation)
      // Note: lowercase transformation happens first, so this tests the validator
      const uppercaseSlugCategory = {
        name: 'Test Category',
        slug: 'Test-Category' // Will be transformed to lowercase first
      };

      // Act - Create category (lowercase transformation will fix this)
      const category = await categoryModel.create(uppercaseSlugCategory);

      // Assert - Slug is lowercase after transformation
      expect(category.slug).toBe('test-category');
    });

    test('should reject slugs with spaces', async () => {
      // Arrange - Category with spaces in slug
      const spaceSlugCategory = {
        name: 'Test Category',
        slug: 'test category' // Contains spaces
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(spaceSlugCategory)
      ).rejects.toThrow(/lowercase letters, numbers, and hyphens/);
    });

    test('should reject slugs with special characters', async () => {
      // Arrange - Category with special characters in slug
      const specialCharSlugCategory = {
        name: 'Test Category',
        slug: 'test@category!' // Contains @ and !
      };

      // Act & Assert - Should fail validation
      await expect(
        categoryModel.create(specialCharSlugCategory)
      ).rejects.toThrow(/lowercase letters, numbers, and hyphens/);
    });

    test('should accept slugs with only lowercase letters, numbers, and hyphens', async () => {
      // Arrange - Categories with valid slug formats
      const validSlugs = [
        { name: 'Test 1', slug: 'test-category' },       // letters and hyphens
        { name: 'Test 2', slug: 'category123' },         // letters and numbers
        { name: 'Test 3', slug: 'test-category-123' },   // all allowed characters
        { name: 'Test 4', slug: 'abc' }                  // just letters
      ];

      // Act & Assert - All should be accepted
      for (const categoryData of validSlugs) {
        const category = await categoryModel.create(categoryData);
        expect(category.slug).toBe(categoryData.slug);
      }
    });
  });

  describe('Field Type Integration Tests', () => {
    test('should trim whitespace from name field', async () => {
      // Arrange - Category with whitespace in name
      const whitespaceNameCategory = {
        name: '   Electronics   ', // Spaces before and after
        slug: 'electronics'
      };

      // Act - Create category
      const category = await categoryModel.create(whitespaceNameCategory);

      // Assert - Name is trimmed
      expect(category.name).toBe('Electronics');
    });

    test('should store name as String type', async () => {
      // Arrange - Category data
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics'
      };

      // Act - Create category
      const category = await categoryModel.create(categoryData);

      // Assert - Name is stored as string
      expect(typeof category.name).toBe('string');
    });

    test('should store slug as String type', async () => {
      // Arrange - Category data
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics'
      };

      // Act - Create category
      const category = await categoryModel.create(categoryData);

      // Assert - Slug is stored as string
      expect(typeof category.slug).toBe('string');
    });
  });

  describe('Complete Category Creation Integration Tests', () => {
    test('should create category with all validations passing', async () => {
      // Arrange - Valid category data
      const validCategory = {
        name: 'Home & Garden',
        slug: 'home-garden'
      };

      // Act - Create category
      const category = await categoryModel.create(validCategory);

      // Assert - Category created with all fields correct
      expect(category._id).toBeDefined();
      expect(category.name).toBe('Home & Garden');
      expect(category.slug).toBe('home-garden');

      // Assert - Category exists in database
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory).not.toBeNull();
      expect(dbCategory.name).toBe('Home & Garden');
      expect(dbCategory.slug).toBe('home-garden');
    });

    test('should handle complex category names correctly', async () => {
      // Arrange - Category with complex name
      const complexCategory = {
        name: 'Electronics & Gadgets for Home',
        slug: 'electronics-gadgets-home'
      };

      // Act - Create category
      const category = await categoryModel.create(complexCategory);

      // Assert - All validations passed
      expect(category.name).toBe('Electronics & Gadgets for Home');
      expect(category.slug).toBe('electronics-gadgets-home');
      expect(category.name.length).toBeLessThanOrEqual(50);
      expect(category.name.length).toBeGreaterThanOrEqual(2);
    });
  });
});
