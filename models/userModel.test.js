import { describe, test, expect } from '@jest/globals';
import User from './userModel.js';

describe('User Model Test Suite', () => {
  describe('Schema Definition Test Suite', () => {
    test('should have all required fields defined', () => {
      const paths = User.schema.paths;

      for (const k of ['name', 'email', 'password', 'phone', 'address', 'answer', 'role']) {
        expect(paths[k]).toBeDefined();
      }
    });

    test('should have all required fields to be of correct type', () => {
      const paths = User.schema.paths; 
      expect(paths.name.instance).toBe('String'); 
      expect(paths.email.instance).toBe('String'); 
      expect(paths.password.instance).toBe('String'); 
      expect(paths.phone.instance).toBe('String'); 
      expect(paths.address.instance).toBe('Mixed'); 
      expect(paths.answer.instance).toBe('String'); 
      expect(paths.role.instance).toBe('Number'); 
    });

    test('should have email field as unique', () => {
      const email = User.schema.paths.email;

      expect(email.options.unique).toBe(true);
      expect(User.schema.indexes().some(([keys, opts]) =>
       keys.email === 1 && opts?.unique === true)).toBe(true);
    });

    test('should have name field with trim enabled', () => {
      const name = User.schema.paths.name;
      
      expect(name.options.trim).toBe(true);
    });

    test('should have role field with default value 0', () => {
      const role = User.schema.paths.role;
      
      expect(role.defaultValue).toBe(0);
    });

    test('timestamps are configured on schema', () => {
      expect(User.schema.options.timestamps).toBe(true);
      expect(User.schema.paths.createdAt).toBeDefined();
      expect(User.schema.paths.updatedAt).toBeDefined();
    });
  });

  describe('Document Validation Test Suite', () => {
    test('should create a valid document with all required fields', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St', city: 'Anytown' },
        answer: 'My security answer'
      });
      const validationError = user.validateSync();

      expect(validationError).toBeUndefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe(0); // default value
    });

   test('should enforce required fields on validation', () => {
      const u = new User({});

      const err = u.validateSync();

      expect(err).toBeDefined();

      for (const k of ['name', 'email', 'password', 'phone', 'address', 'answer']) {
        expect(err.errors).toHaveProperty(k);
      }
      expect(err.errors).not.toHaveProperty('role');
    });

    test('should assign default role value when not provided', () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        phone: '0987654321',
        address: { street: '456 Oak St' },
        answer: 'Another answer'
      });
      
      expect(user.role).toBe(0);
    });

    test('should trim whitespace from name field', () => {
      const user = new User({
        name: '   John Doe   ',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'My answer'
      });
      expect(user.name).toBe('John Doe');
    });
  });

  describe('Model Export Test Suite', () => {
    test('should export a valid mongoose model', () => {
      expect(User).toBeDefined();
      expect(typeof User).toBe('function');
      expect(User.modelName).toBe('users');
      expect(User.collection.collectionName).toBe('users');
    })
  });
});