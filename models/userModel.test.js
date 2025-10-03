/**
 * Unit Tests for userModel.js
 * 
 * - Mongoose schema structure and field definitions (name, email, password, phone, address, answer, role)
 * - Field types, constraints, and validation rules (unique email, trim whitespace, required fields)
 * - Default values and schema options (role defaults to 0, timestamps enabled)
 * - Document creation and validation with both valid and invalid data
 * - Model export and MongoDB collection configuration
 * - Missing email format validation (accepts invalid email formats)
 * - Weak password security (no minimum length requirements)
 * - Invalid phone number acceptance (no format validation)
 * - Security vulnerabilities in data validation and input sanitization
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect } from '@jest/globals';
import User from './userModel.js';

describe('User Model Test Suite', () => {
  describe('Schema Definition Test Suite', () => {
    test('should have all required fields defined', () => {
      // Arrange - Get schema field definitions
      const paths = User.schema.paths;

      // Act & Assert - Verify all required fields exist
      for (const k of ['name', 'email', 'password', 'phone', 'address', 'answer', 'role']) {
        expect(paths[k]).toBeDefined();
      }
    });

    test('should have all required fields to be of correct type', () => {
      // Arrange - Get schema field definitions
      const paths = User.schema.paths;
      
      // Act & Assert - Verify field types match schema definition
      expect(paths.name.instance).toBe('String'); 
      expect(paths.email.instance).toBe('String'); 
      expect(paths.password.instance).toBe('String'); 
      expect(paths.phone.instance).toBe('String'); 
      expect(paths.address.instance).toBe('Mixed'); 
      expect(paths.answer.instance).toBe('String'); 
      expect(paths.role.instance).toBe('Number'); 
    });

    test('should have email field as unique', () => {
      // Arrange - Get email field configuration
      const email = User.schema.paths.email;

      // Act & Assert - Verify email uniqueness constraint
      expect(email.options.unique).toBe(true);
      expect(User.schema.indexes().some(([keys, opts]) =>
       keys.email === 1 && opts?.unique === true)).toBe(true);
    });

    test('should have name field with trim enabled', () => {
      // Arrange - Get name field configuration
      const name = User.schema.paths.name;
      
      // Act & Assert - Verify trim option is enabled
      expect(name.options.trim).toBe(true);
    });

    test('should have role field with default value 0', () => {
      // Arrange - Get role field configuration
      const role = User.schema.paths.role;
      
      // Act & Assert - Verify default role value
      expect(role.defaultValue).toBe(0);
    });

    test('timestamps are configured on schema', () => {
      // Arrange - No setup needed for schema options
      
      // Act & Assert - Verify timestamps are enabled and fields exist
      expect(User.schema.options.timestamps).toBe(true);
      expect(User.schema.paths.createdAt).toBeDefined();
      expect(User.schema.paths.updatedAt).toBeDefined();
    });
  });

  describe('Document Validation Test Suite', () => {
    test('should create a valid document with all required fields', () => {
      // Arrange - Set up valid user data
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St', city: 'Anytown' },
        answer: 'My security answer'
      };
      
      // Act - Create user document and validate
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert - Verify document is valid with correct values
      expect(validationError).toBeUndefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe(0); // default value
    });

   test('should enforce required fields on validation', () => {
      // Arrange - Create empty user document
      const u = new User({});

      // Act - Validate the document
      const err = u.validateSync();

      // Assert - Verify validation errors for required fields
      expect(err).toBeDefined();

      for (const k of ['name', 'email', 'password', 'phone', 'address', 'answer']) {
        expect(err.errors).toHaveProperty(k);
      }
      expect(err.errors).not.toHaveProperty('role');
    });

    test('should assign default role value when not provided', () => {
      // Arrange - Set up user data without role field
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '0987654321',
        address: { street: '456 Oak St' },
        answer: 'Another answer'
      };
      
      // Act - Create user document
      const user = new User(userData);
      
      // Assert - Verify default role value is assigned
      expect(user.role).toBe(0);
    });

    test('should trim whitespace from name field', () => {
      // Arrange - Set up user data with whitespace in name
      const userData = {
        name: '   John Doe   ',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'My answer'
      };
      
      // Act - Create user document
      const user = new User(userData);
      
      // Assert - Verify name is trimmed
      expect(user.name).toBe('John Doe');
    });
  });

  describe('Model Export Test Suite', () => {
    test('should export a valid mongoose model', () => {
      // Arrange - No setup needed for model export test
      
      // Act & Assert - Verify model export and configuration
      expect(User).toBeDefined();
      expect(typeof User).toBe('function');
      expect(User.modelName).toBe('users');
      expect(User.collection.collectionName).toBe('users');
    })
  });

  describe('Bug Detection Test Suite', () => {
    // Email Validation Missing
    test('should reject invalid email formats - EXPOSES VALIDATION BUG', () => {
      // Arrange - Set up user data with invalid email
      const userDataInvalidEmail = {
        name: 'John Doe',
        email: 'not-an-email-address', // Invalid email format
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'security answer'
      };
      
      // Act - Create user document and validate
      const user = new User(userDataInvalidEmail);
      const validationError = user.validateSync();
      
      // Assert - Should fail validation and now it does (bug fixed!)
      // Schema now validates email format properly
      // Invalid emails like "abc", "123", "not@email" are properly rejected
      expect(validationError).toBeDefined(); // Validation error should exist for invalid email
      expect(validationError.errors.email).toBeDefined(); // Specific email error should exist
    });

    // Weak Password Acceptance
    test('should reject weak passwords - EXPOSES SECURITY BUG', () => {
      // Arrange - Set up user data with extremely weak password
      const userDataWeakPassword = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '1',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'security answer'
      };
      
      // Act - Create user document and validate
      const user = new User(userDataWeakPassword);
      const validationError = user.validateSync();
      
      // Assert - Should fail validation
      // Schema now enforces minimum password length
      // Weak passwords like "1", "a", "" are properly rejected
      expect(validationError).toBeDefined(); // Validation error should exist for weak password
      expect(validationError.errors.password).toBeDefined(); // Specific password error should exist
    });

    // Invalid Phone Number Acceptance
    test('should reject invalid phone numbers - EXPOSES VALIDATION BUG', () => {
      // Arrange - Set up user data with invalid phone number
      const userDataInvalidPhone = {
        name: 'John Doe',
        email: 'john@example.com', 
        password: 'password123',
        phone: 'abc-not-a-phone',
        address: { street: '123 Main St' },
        answer: 'security answer'
      };
      
      // Act - Create user document and validate
      const user = new User(userDataInvalidPhone);
      const validationError = user.validateSync();
      
      // Assert - Should fail validation
      // Schema now validates phone number format
      // Invalid phone numbers like "abc", "!!!", "email@test.com" are properly rejected
      expect(validationError).toBeDefined(); // Validation error should exist for invalid phone
      expect(validationError.errors.phone).toBeDefined(); // Specific phone error should exist
    });
  });
});