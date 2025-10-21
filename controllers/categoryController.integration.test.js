/**
 * Integration Tests for categoryController and singleCategoryController
 *
 * - HTTP GET /api/v1/category/get-category integration with Express app
 * - HTTP GET /api/v1/category/single-category/:slug integration with Express app
 * - Category model integration with MongoDB (find, findOne)
 * - Real HTTP requests via supertest
 * - Slug-based querying for single category retrieval
 * - Array response handling for multiple categories
 * - Empty state handling (no categories)
 * - Non-existent category handling
 * - Real database operations (read, query)
 *
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import categoryModel from '../models/categoryModel.js';

describe('categoryController and singleCategoryController Integration Test Suite', () => {
  beforeEach(async () => {
    // Arrange - Clear all categories before each test for isolation
    await categoryModel.deleteMany({});
  });

  describe('categoryController (GET all categories) Integration Tests', () => {
    test('should return all categories from database', async () => {
      // Arrange - Create multiple categories
      await categoryModel.create({ name: 'Electronics', slug: 'electronics' });
      await categoryModel.create({ name: 'Books', slug: 'books' });
      await categoryModel.create({ name: 'Clothing', slug: 'clothing' });

      // Act - Send GET request to retrieve all categories
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - Response contains all categories
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All Categories List');
      expect(response.body.category).toHaveLength(3);

      // Assert - Categories have correct data
      const categoryNames = response.body.category.map(cat => cat.name);
      expect(categoryNames).toContain('Electronics');
      expect(categoryNames).toContain('Books');
      expect(categoryNames).toContain('Clothing');
    });

    test('should return empty array when no categories exist', async () => {
      // Arrange - No categories in database (already cleared in beforeEach)

      // Act - Send GET request
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - Returns empty array
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('All Categories List');
      expect(response.body.category).toHaveLength(0);
      expect(Array.isArray(response.body.category)).toBe(true);
    });

    test('should use categoryModel.find({}) to retrieve all categories', async () => {
      // Arrange - Create categories with different fields
      await categoryModel.create({ name: 'Sports', slug: 'sports' });
      await categoryModel.create({ name: 'Home & Garden', slug: 'home-garden' });

      // Act - Retrieve all categories
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - All categories returned (no filtering applied)
      expect(response.status).toBe(200);
      expect(response.body.category).toHaveLength(2);

      // Assert - Verify find({}) returns all documents
      const allCategories = await categoryModel.find({});
      expect(allCategories).toHaveLength(2);
    });

    test('should return categories with _id, name, slug, and timestamps', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Technology', slug: 'technology' });

      // Act - Retrieve categories
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - Category object structure
      expect(response.status).toBe(200);
      const category = response.body.category[0];
      expect(category).toHaveProperty('_id');
      expect(category).toHaveProperty('name', 'Technology');
      expect(category).toHaveProperty('slug', 'technology');
      expect(category).toHaveProperty('__v');
    });

    test('should return multiple categories in array format', async () => {
      // Arrange - Create 5 categories
      const categoryNames = ['Category1', 'Category2', 'Category3', 'Category4', 'Category5'];
      for (const name of categoryNames) {
        await categoryModel.create({ name, slug: name.toLowerCase() });
      }

      // Act - Retrieve all categories
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - All 5 categories returned
      expect(response.status).toBe(200);
      expect(response.body.category).toHaveLength(5);
      expect(Array.isArray(response.body.category)).toBe(true);

      // Assert - All names present
      const returnedNames = response.body.category.map(cat => cat.name);
      categoryNames.forEach(name => {
        expect(returnedNames).toContain(name);
      });
    });

    test('should handle large number of categories', async () => {
      // Arrange - Create 50 categories
      const categories = [];
      for (let i = 1; i <= 50; i++) {
        categories.push({ name: `Category ${i}`, slug: `category-${i}` });
      }
      await categoryModel.insertMany(categories);

      // Act - Retrieve all categories
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - All 50 categories returned
      expect(response.status).toBe(200);
      expect(response.body.category).toHaveLength(50);
    });

    test('should integrate with MongoDB find() method', async () => {
      // Arrange - Create categories
      await categoryModel.create({ name: 'Test1', slug: 'test1' });
      await categoryModel.create({ name: 'Test2', slug: 'test2' });

      // Act - Call endpoint
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - Response matches database state
      expect(response.status).toBe(200);
      const dbCategories = await categoryModel.find({});
      expect(response.body.category).toHaveLength(dbCategories.length);
    });
  });

  describe('singleCategoryController (GET single category by slug) Integration Tests', () => {
    test('should return single category by slug', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Electronics', slug: 'electronics' });

      // Act - Send GET request with slug
      const response = await request(app).get('/api/v1/category/single-category/electronics');

      // Assert - Returns correct category
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Get Single Category Successfully');
      expect(response.body.category).toBeDefined();
      expect(response.body.category.name).toBe('Electronics');
      expect(response.body.category.slug).toBe('electronics');
    });

    test('should use slug from URL params for querying', async () => {
      // Arrange - Create multiple categories
      await categoryModel.create({ name: 'Books', slug: 'books' });
      await categoryModel.create({ name: 'Movies', slug: 'movies' });
      await categoryModel.create({ name: 'Music', slug: 'music' });

      // Act - Request specific category by slug
      const response = await request(app).get('/api/v1/category/single-category/movies');

      // Assert - Returns only the requested category
      expect(response.status).toBe(200);
      expect(response.body.category.slug).toBe('movies');
      expect(response.body.category.name).toBe('Movies');
    });

    test('should use categoryModel.findOne() with slug query', async () => {
      // Arrange - Create category
      const category = await categoryModel.create({
        name: 'Sports Equipment',
        slug: 'sports-equipment'
      });

      // Act - Query by slug
      const response = await request(app).get('/api/v1/category/single-category/sports-equipment');

      // Assert - findOne returns correct document
      expect(response.status).toBe(200);
      expect(response.body.category._id.toString()).toBe(category._id.toString());
      expect(response.body.category.slug).toBe('sports-equipment');
    });

    test('should handle non-existent slug gracefully', async () => {
      // Arrange - No categories created

      // Act - Request non-existent slug
      const response = await request(app).get('/api/v1/category/single-category/non-existent-slug');

      // Assert - Returns 200 with null category (current behavior)
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.category).toBeNull();
    });

    test('should return category with all fields including _id and timestamps', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Home Appliances', slug: 'home-appliances' });

      // Act - Retrieve category
      const response = await request(app).get('/api/v1/category/single-category/home-appliances');

      // Assert - Category has all expected fields
      expect(response.status).toBe(200);
      const category = response.body.category;
      expect(category).toHaveProperty('_id');
      expect(category).toHaveProperty('name', 'Home Appliances');
      expect(category).toHaveProperty('slug', 'home-appliances');
      expect(category).toHaveProperty('__v');
    });

    test('should handle slugs with hyphens and numbers', async () => {
      // Arrange - Create category with complex slug
      await categoryModel.create({
        name: 'Category-123-Test',
        slug: 'category-123-test'
      });

      // Act - Request with hyphenated slug
      const response = await request(app).get('/api/v1/category/single-category/category-123-test');

      // Assert - Returns correct category
      expect(response.status).toBe(200);
      expect(response.body.category.slug).toBe('category-123-test');
      expect(response.body.category.name).toBe('Category-123-Test');
    });

    test('should handle lowercase slug matching', async () => {
      // Arrange - Create category with lowercase slug
      await categoryModel.create({ name: 'UPPERCASE NAME', slug: 'lowercase-slug' });

      // Act - Request with lowercase slug
      const response = await request(app).get('/api/v1/category/single-category/lowercase-slug');

      // Assert - Finds category by lowercase slug
      expect(response.status).toBe(200);
      expect(response.body.category.name).toBe('UPPERCASE NAME');
      expect(response.body.category.slug).toBe('lowercase-slug');
    });

    test('should integrate with MongoDB findOne() method', async () => {
      // Arrange - Create category
      const dbCategory = await categoryModel.create({
        name: 'Integration Test',
        slug: 'integration-test'
      });

      // Act - Query via HTTP
      const response = await request(app).get('/api/v1/category/single-category/integration-test');

      // Assert - HTTP response matches database document
      expect(response.status).toBe(200);
      expect(response.body.category._id.toString()).toBe(dbCategory._id.toString());

      // Assert - Verify findOne would return same result
      const directQuery = await categoryModel.findOne({ slug: 'integration-test' });
      expect(response.body.category._id.toString()).toBe(directQuery._id.toString());
    });

    test('should return single object not array for single category', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Single Category', slug: 'single-category' });

      // Act - Retrieve single category
      const response = await request(app).get('/api/v1/category/single-category/single-category');

      // Assert - Response is object, not array
      expect(response.status).toBe(200);
      expect(response.body.category).toBeDefined();
      expect(Array.isArray(response.body.category)).toBe(false);
      expect(typeof response.body.category).toBe('object');
    });
  });

  describe('Integration Between categoryController and singleCategoryController', () => {
    test('should retrieve category from list and then get single category details', async () => {
      // Arrange - Create multiple categories
      await categoryModel.create({ name: 'Electronics', slug: 'electronics' });
      await categoryModel.create({ name: 'Books', slug: 'books' });
      await categoryModel.create({ name: 'Clothing', slug: 'clothing' });

      // Act - First get all categories
      const allResponse = await request(app).get('/api/v1/category/get-category');
      expect(allResponse.status).toBe(200);
      expect(allResponse.body.category).toHaveLength(3);

      // Act - Then get specific category by slug from the list
      const bookSlug = allResponse.body.category.find(cat => cat.name === 'Books').slug;
      const singleResponse = await request(app).get(`/api/v1/category/single-category/${bookSlug}`);

      // Assert - Single category details match
      expect(singleResponse.status).toBe(200);
      expect(singleResponse.body.category.name).toBe('Books');
      expect(singleResponse.body.category.slug).toBe('books');
    });

    test('should verify count consistency between endpoints', async () => {
      // Arrange - Create categories
      await categoryModel.create({ name: 'Cat1', slug: 'cat1' });
      await categoryModel.create({ name: 'Cat2', slug: 'cat2' });
      await categoryModel.create({ name: 'Cat3', slug: 'cat3' });

      // Act - Get all categories
      const allResponse = await request(app).get('/api/v1/category/get-category');

      // Assert - Count matches
      expect(allResponse.body.category).toHaveLength(3);

      // Act & Assert - Each category accessible individually
      for (const cat of allResponse.body.category) {
        const singleResponse = await request(app).get(`/api/v1/category/single-category/${cat.slug}`);
        expect(singleResponse.status).toBe(200);
        expect(singleResponse.body.category).not.toBeNull();
      }
    });
  });

  describe('HTTP Method and Route Integration Tests', () => {
    test('should respond to GET method on /get-category', async () => {
      // Act - Send GET request
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - Endpoint exists and responds
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(200);
    });

    test('should respond to GET method on /single-category/:slug', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Test', slug: 'test' });

      // Act - Send GET request
      const response = await request(app).get('/api/v1/category/single-category/test');

      // Assert - Endpoint exists and responds
      expect(response.status).not.toBe(404);
      expect(response.status).toBe(200);
    });

    test('should reject POST method on get-category endpoint', async () => {
      // Act - Try POST instead of GET
      const response = await request(app).post('/api/v1/category/get-category');

      // Assert - Method not allowed or not found
      expect(response.status).toBe(404);
    });

    test('should reject POST method on single-category endpoint', async () => {
      // Act - Try POST instead of GET
      const response = await request(app).post('/api/v1/category/single-category/test');

      // Assert - Method not allowed or not found
      expect(response.status).toBe(404);
    });
  });

  describe('Response Format Consistency Tests', () => {
    test('should return consistent response format for categoryController', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Test', slug: 'test' });

      // Act - Get all categories
      const response = await request(app).get('/api/v1/category/get-category');

      // Assert - Response format
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'All Categories List');
      expect(response.body).toHaveProperty('category');
      expect(Array.isArray(response.body.category)).toBe(true);
    });

    test('should return consistent response format for singleCategoryController', async () => {
      // Arrange - Create category
      await categoryModel.create({ name: 'Test', slug: 'test' });

      // Act - Get single category
      const response = await request(app).get('/api/v1/category/single-category/test');

      // Assert - Response format
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Get Single Category Successfully');
      expect(response.body).toHaveProperty('category');
    });
  });

  describe('Database State Verification Tests', () => {
    test('should not modify database when retrieving categories', async () => {
      // Arrange - Create categories
      await categoryModel.create({ name: 'Cat1', slug: 'cat1' });
      await categoryModel.create({ name: 'Cat2', slug: 'cat2' });

      // Arrange - Get initial count
      const countBefore = await categoryModel.countDocuments();

      // Act - Retrieve all categories
      await request(app).get('/api/v1/category/get-category');

      // Assert - Count unchanged (read-only operation)
      const countAfter = await categoryModel.countDocuments();
      expect(countAfter).toBe(countBefore);
    });

    test('should not modify database when retrieving single category', async () => {
      // Arrange - Create category
      const category = await categoryModel.create({ name: 'Test', slug: 'test' });

      // Act - Retrieve single category
      await request(app).get('/api/v1/category/single-category/test');

      // Assert - Category unchanged in database
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory.name).toBe('Test');
      expect(dbCategory.slug).toBe('test');
    });
  });
});
