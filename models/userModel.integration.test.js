/**
 * Integration Tests for userModel.js
 *
 * - Mongoose schema integration with MongoDB (in-memory)
 * - Email regex validation enforcement by MongoDB
 * - Unique email constraint enforcement at database level
 * - Phone number regex validation enforcement by MongoDB
 * - Password minimum length validation enforcement by MongoDB
 * - Real database operations (create, validate, constraint checking)
 * - Integration between Mongoose validators and MongoDB constraints
 *
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import userModel from './userModel.js';

describe('User Model Integration Test Suite', () => {
  beforeEach(async () => {
    // Arrange - Clear all users before each test for isolation
    await userModel.deleteMany({});
  });

  describe('Email Validation Integration Tests', () => {
    test('should reject invalid email formats using regex validator', async () => {
      // Arrange - User data with invalid email
      const invalidEmailUser = {
        name: 'Test User',
        email: 'not-an-email', // Invalid format - no @ or domain
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act & Assert - Attempt to create user should fail validation
      await expect(
        userModel.create(invalidEmailUser)
      ).rejects.toThrow(/valid email/);
    });

    test('should accept valid email formats', async () => {
      // Arrange - User data with valid email
      const validUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act - Create user with valid email
      const user = await userModel.create(validUser);

      // Assert - User created successfully with correct email
      expect(user.email).toBe('test@example.com');
      expect(user._id).toBeDefined();
    });

    test('should reject emails without domain', async () => {
      // Arrange - User data with email missing domain
      const noDomainUser = {
        name: 'Test User',
        email: 'test@',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act & Assert - Should fail validation
      await expect(
        userModel.create(noDomainUser)
      ).rejects.toThrow(/valid email/);
    });

    test('should reject emails without @ symbol', async () => {
      // Arrange - User data with email missing @ symbol
      const noAtSymbolUser = {
        name: 'Test User',
        email: 'testexample.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act & Assert - Should fail validation
      await expect(
        userModel.create(noAtSymbolUser)
      ).rejects.toThrow(/valid email/);
    });
  });

  describe('Unique Email Constraint Integration Tests', () => {
    test('should enforce unique email constraint at database level', async () => {
      // Arrange - Create first user
      const firstUser = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };
      await userModel.create(firstUser);

      // Act & Assert - Attempt to create second user with same email
      const duplicateUser = {
        name: 'Second User',
        email: 'duplicate@example.com', // Same email
        password: 'different password',
        phone: '9876543210', // Valid phone (starts with 1-9)
        address: { street: '456 Oak St' },
        answer: 'different answer'
      };

      await expect(
        userModel.create(duplicateUser)
      ).rejects.toThrow(/duplicate key/);
    });

    test('should allow different emails for different users', async () => {
      // Arrange - Create first user
      await userModel.create({
        name: 'First User',
        email: 'first@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      });

      // Act - Create second user with different email
      await userModel.create({
        name: 'Second User',
        email: 'second@example.com', // Different email
        password: 'password456',
        phone: '9876543210', // Valid phone (starts with 1-9)
        address: { street: '456 Oak St' },
        answer: 'test answer'
      });

      // Assert - Both users exist in database
      const users = await userModel.find({});
      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('first@example.com');
      expect(users[1].email).toBe('second@example.com');
    });
  });

  describe('Phone Number Validation Integration Tests', () => {
    test('should reject invalid phone number formats using regex validator', async () => {
      // Arrange - User data with invalid phone (contains letters)
      const invalidPhoneUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: 'abc-not-a-phone', // Invalid format
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act & Assert - Should fail validation
      await expect(
        userModel.create(invalidPhoneUser)
      ).rejects.toThrow(/valid phone/);
    });

    test('should accept valid phone number formats', async () => {
      // Arrange - User data with valid phone numbers
      const validPhoneFormats = [
        { phone: '1234567890', email: 'test1@example.com' },      // Simple digits
        { phone: '+1234567890', email: 'test2@example.com' },     // With country code
        { phone: '91234567890', email: 'test3@example.com' },     // Starting with digit
      ];

      // Act & Assert - All valid formats should be accepted
      for (const phoneData of validPhoneFormats) {
        const user = await userModel.create({
          name: 'Test User',
          email: phoneData.email, // Unique email
          password: 'password123',
          phone: phoneData.phone,
          address: { street: '123 Main St' },
          answer: 'test answer'
        });

        expect(user.phone).toBe(phoneData.phone);
      }
    });

    test('should reject phone numbers with special characters', async () => {
      // Arrange - User data with phone containing special characters
      const specialCharPhoneUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '!!!-###-####', // Invalid - special characters
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act & Assert - Should fail validation
      await expect(
        userModel.create(specialCharPhoneUser)
      ).rejects.toThrow(/valid phone/);
    });
  });

  describe('Password Length Validation Integration Tests', () => {
    test('should reject passwords shorter than minimum length', async () => {
      // Arrange - User data with password too short (less than 8 chars)
      const shortPasswordUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass', // Only 4 characters - too short
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act & Assert - Should fail validation
      await expect(
        userModel.create(shortPasswordUser)
      ).rejects.toThrow(/at least 8 characters/);
    });

    test('should accept passwords meeting minimum length requirement', async () => {
      // Arrange - User data with password exactly 8 characters
      const validPasswordUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password', // Exactly 8 characters
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act - Create user with valid password
      const user = await userModel.create(validPasswordUser);

      // Assert - User created successfully
      expect(user._id).toBeDefined();
      expect(user.password).toBe('password');
    });

    test('should accept passwords longer than minimum length', async () => {
      // Arrange - User data with long password
      const longPasswordUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'this-is-a-very-long-password-with-many-characters', // Much longer than 8
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act - Create user with long password
      const user = await userModel.create(longPasswordUser);

      // Assert - User created successfully
      expect(user._id).toBeDefined();
      expect(user.password).toBe('this-is-a-very-long-password-with-many-characters');
    });
  });

  describe('Required Fields Validation Integration Tests', () => {
    test('should reject user creation when required fields are missing', async () => {
      // Arrange - User data missing required fields
      const incompleteUser = {
        name: 'Test User'
        // Missing: email, password, phone, address, answer
      };

      // Act & Assert - Should fail validation for missing required fields
      await expect(
        userModel.create(incompleteUser)
      ).rejects.toThrow();
    });

    test('should create user successfully with all required fields', async () => {
      // Arrange - Complete user data
      const completeUser = {
        name: 'Test User',
        email: 'complete@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St', city: 'Test City' },
        answer: 'test answer'
      };

      // Act - Create user
      const user = await userModel.create(completeUser);

      // Assert - User created with all fields
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('complete@example.com');
      expect(user.password).toBe('password123');
      expect(user.phone).toBe('1234567890');
      expect(user.address).toEqual({ street: '123 Main St', city: 'Test City' });
      expect(user.answer).toBe('test answer');
      expect(user.role).toBe(0); // Default value
    });
  });

  describe('Default Values Integration Tests', () => {
    test('should assign default role value when not provided', async () => {
      // Arrange - User data without role field
      const userWithoutRole = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act - Create user
      const user = await userModel.create(userWithoutRole);

      // Assert - Default role is 0
      expect(user.role).toBe(0);
    });

    test('should allow custom role value when provided', async () => {
      // Arrange - User data with admin role
      const adminUser = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer',
        role: 1 // Admin role
      };

      // Act - Create admin user
      const user = await userModel.create(adminUser);

      // Assert - Custom role is preserved
      expect(user.role).toBe(1);
    });
  });

  describe('Timestamps Integration Tests', () => {
    test('should automatically add createdAt and updatedAt timestamps', async () => {
      // Arrange - User data
      const userData = {
        name: 'Test User',
        email: 'timestamp@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'test answer'
      };

      // Act - Create user
      const user = await userModel.create(userData);

      // Assert - Timestamps are present
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
