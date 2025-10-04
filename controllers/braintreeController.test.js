/**
 * Unit Tests for Braintree Payment Functions in productController.js
 * 
 * - Payment gateway integration and token generation
 * - Braintree client token generation for frontend payment forms
 * - Payment processing with Braintree transaction handling
 * - Order creation and database persistence after successful payment
 * - Error handling for payment failures and network issues
 * - Cart total calculation and payment amount processing
 * - Security considerations for payment data handling
 * - Async callback handling for Braintree gateway responses
 * - Boundary testing for edge cases and invalid inputs
 * - Comprehensive error scenario coverage
 * 
 * AI was utilized in the making of this file
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';

let mockSave, mockOrderInstance, mockOrderModel;

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Create fresh mock instances
  mockSave = jest.fn();
  mockOrderInstance = {
    save: mockSave
  };
  mockOrderModel = jest.fn().mockReturnValue(mockOrderInstance);
});

// Mock the Braintree gateway with all methods
const mockGateway = {
  clientToken: {
    generate: jest.fn()
  },
  transaction: {
    sale: jest.fn()
  }
};

// Mock all dependencies
jest.unstable_mockModule('../models/orderModel.js', () => ({
  default: jest.fn().mockImplementation(() => mockOrderInstance)
}));

jest.unstable_mockModule('braintree', () => ({
  default: {
    BraintreeGateway: jest.fn(() => mockGateway),
    Environment: {
      Sandbox: 'sandbox'
    }
  }
}));

const { braintreeTokenController, brainTreePaymentController } = await import('./productController.js');

describe('Braintree Payment Controllers Test Suite', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { _id: 'user123' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Reset gateway mocks
    mockGateway.clientToken.generate.mockReset();
    mockGateway.transaction.sale.mockReset();
    mockSave.mockReset().mockResolvedValue({ _id: 'order123' });
  });

  describe('braintreeTokenController Test Suite', () => {
    test('should generate client token successfully', (done) => {
      // Arrange - Set up successful token generation
      const mockTokenResponse = {
        clientToken: 'sandbox_token_12345',
        success: true
      };
      
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        // Verify correct options passed
        expect(options).toEqual({});
        callback(null, mockTokenResponse);
      });

      // Mock res.send to capture response
      mockRes.send = jest.fn((response) => {
        try {
          // Assert - Verify correct response structure
          expect(mockGateway.clientToken.generate).toHaveBeenCalledTimes(1);
          expect(response).toEqual(mockTokenResponse);
          expect(response.clientToken).toBe('sandbox_token_12345');
          expect(response.success).toBe(true);
          done();
        } catch (error) {
          done(error);
        }
      });

      // Act - Call the controller function
      braintreeTokenController(mockReq, mockRes);
    });

    test('should handle Braintree API errors correctly', (done) => {
      // Arrange - Set up Braintree API error
      const braintreeError = new Error('Invalid merchant ID');
      
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(braintreeError, null);
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock error response capture
      mockRes.send = jest.fn((response) => {
        try {
          // Assert - CORRECT behavior: should preserve original error for debugging
          expect(consoleSpy).toHaveBeenCalledWith(braintreeError);
          expect(mockRes.status).toHaveBeenCalledWith(500);
          expect(response.success).toBe(false);
          expect(response.message).toBe('Error generating payment token');
          expect(response.error).toBe('Invalid merchant ID'); // Should preserve original error message
          
          consoleSpy.mockRestore();
          done();
        } catch (error) {
          consoleSpy.mockRestore();
          done(error);
        }
      });

      // Act - Call the controller function
      braintreeTokenController(mockReq, mockRes);
    });

    test('should handle network timeout scenarios correctly', (done) => {
      // Arrange - Set up timeout scenario
      const timeoutError = new Error('Gateway timeout');
      
      mockGateway.clientToken.generate.mockImplementation((options, callback) => {
        callback(timeoutError, null);
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockRes.send = jest.fn((response) => {
        try {
          // Assert - Should preserve timeout error message
          expect(response.success).toBe(false);
          expect(response.message).toBe('Error generating payment token');
          expect(response.error).toBe('Gateway timeout'); // Should preserve original error message
          consoleSpy.mockRestore();
          done();
        } catch (error) {
          consoleSpy.mockRestore();
          done(error);
        }
      });

      // Act - Call the controller function
      braintreeTokenController(mockReq, mockRes);
    });

    test('should handle unexpected exceptions gracefully', (done) => {
      // Arrange - Set up unexpected error
      mockGateway.clientToken.generate.mockImplementation(() => {
        throw new Error('Unexpected error in generate');
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockRes.send = jest.fn((response) => {
        try {
          // Assert - Should handle exceptions properly
          expect(response.success).toBe(false);
          expect(response.message).toBe('Error generating payment token');
          expect(response.error).toBe('Unexpected error in generate');
          consoleSpy.mockRestore();
          done();
        } catch (error) {
          consoleSpy.mockRestore();
          done(error);
        }
      });

      // Act - Call the controller function
      braintreeTokenController(mockReq, mockRes);
    });
  });

  describe('brainTreePaymentController Test Suite', () => {
    test('should process payment successfully and create order', async () => {
      // Arrange - Set up successful payment scenario
      const mockCart = [
        { _id: 'prod1', name: 'Product 1', price: 25.99 },
        { _id: 'prod2', name: 'Product 2', price: 34.50 }
      ];
      
      const mockNonce = 'fake-valid-nonce-12345';
      const expectedTotal = 60.49;
      
      mockReq.body = {
        nonce: mockNonce,
        cart: mockCart
      };

      const mockTransactionResult = {
        success: true,
        transaction: {
          id: 'txn_abc123',
          amount: expectedTotal,
          status: 'submitted_for_settlement'
        }
      };

      // Mock successful transaction
      mockGateway.transaction.sale.mockImplementation((transactionData, callback) => {
        // Verify transaction data is correct
        expect(transactionData.amount).toBeCloseTo(expectedTotal, 2);
        expect(transactionData.paymentMethodNonce).toBe(mockNonce);
        expect(transactionData.options.submitForSettlement).toBe(true);
        
        // Call success callback
        callback(null, mockTransactionResult);
      });

      // Mock successful order save
      mockSave.mockResolvedValue({ _id: 'order123', orderId: 'ORD123' });

      const jsonPromise = new Promise((resolve) => {
        mockRes.json = jest.fn((response) => {
          resolve(response);
        });
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);

      // Assert - Wait for async operations to complete
      const response = await jsonPromise;
      expect(mockGateway.transaction.sale).toHaveBeenCalledTimes(1);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(response.ok).toBe(true);
    });

    test('should validate input and reject missing nonce', (done) => {
      // Arrange - Set up missing nonce
      mockReq.body = {
        cart: [{ _id: 'prod1', price: 10.00 }]
        // nonce is undefined
      };
      
      mockRes.send = jest.fn((response) => {
        try {
          // Assert - Should validate input before calling Braintree
          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(response.success).toBe(false);
          expect(response.message).toBe('Payment nonce is required');
          done();
        } catch (error) {
          done(error);
        }
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);
    });

    test('should validate input and reject missing cart', (done) => {
      // Arrange - Set up missing cart
      mockReq.body = {
        nonce: 'fake-valid-nonce'
        // cart is undefined
      };
      
      mockRes.send = jest.fn((response) => {
        try {
          // Assert - Should validate cart before processing
          expect(mockRes.status).toHaveBeenCalledWith(400);
          expect(response.success).toBe(false);
          expect(response.message).toBe('Shopping cart is required');
          done();
        } catch (error) {
          done(error);
        }
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);
    });
     
    test('should handle empty cart by calculating zero total', (done) => {
      // Arrange - Set up empty cart (should proceed to gateway with 0 total)
      mockReq.body = {
        nonce: 'fake-valid-nonce',
        cart: []
      };

      mockGateway.transaction.sale.mockImplementation((transactionData, callback) => {
        try {
          // Assert - Should calculate zero total for empty cart
          expect(transactionData.amount).toBe(0);
          expect(transactionData.paymentMethodNonce).toBe('fake-valid-nonce');
          
          // Mock successful response for zero amount
          callback(null, { success: true, transaction: { id: 'txn_empty_cart' } });
        } catch (error) {
          done(error);
        }
      });

      mockRes.json = jest.fn((response) => {
        expect(response.ok).toBe(true);
        done();
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);
    });

    test('should calculate cart total correctly using reduce method', (done) => {
      // Arrange - Set up complex cart with decimal precision testing
      const mockCart = [
        { _id: 'prod1', name: 'Product 1', price: 10.99 },
        { _id: 'prod2', name: 'Product 2', price: 25.50 },
        { _id: 'prod3', name: 'Product 3', price: 99.99 },
        { _id: 'prod4', name: 'Product 4', price: 0.01 }
      ];
      
      const expectedTotal = 136.49;
      
      mockReq.body = {
        nonce: 'fake-valid-nonce',
        cart: mockCart
      };

      mockGateway.transaction.sale.mockImplementation((transactionData, callback) => {
        try {
          // Assert - Should use reduce() for calculation, not map()
          expect(transactionData.amount).toBeCloseTo(expectedTotal, 2);
          expect(transactionData.paymentMethodNonce).toBe('fake-valid-nonce');
          
          // Mock successful response
          callback(null, { success: true, transaction: { id: 'txn_total_test' } });
        } catch (error) {
          done(error);
        }
      });

      mockRes.json = jest.fn((response) => {
        expect(response.ok).toBe(true);
        done();
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);
    });

    test('should handle payment processing errors correctly', (done) => {
      // Arrange - Set up payment decline scenario
      const mockCart = [
        { _id: 'prod1', name: 'Product 1', price: 25.99 }
      ];
      
      mockReq.body = {
        nonce: 'fake-declined-nonce',
        cart: mockCart
      };

      const paymentError = new Error('Credit card declined');
      
      mockGateway.transaction.sale.mockImplementation((transactionData, callback) => {
        // Verify transaction was attempted
        expect(transactionData.amount).toBeCloseTo(25.99, 2);
        expect(transactionData.paymentMethodNonce).toBe('fake-declined-nonce');
        
        // Return payment error (result is null when error)
        callback(paymentError, null);
      });
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockRes.send = jest.fn((response) => {
        try {
          // Assert - Should preserve original error for debugging
          expect(consoleSpy).toHaveBeenCalledWith(paymentError);
          expect(mockRes.status).toHaveBeenCalledWith(500);
          expect(response.success).toBe(false);
          expect(response.message).toBe('Error processing payment');
          expect(response.error).toBe('Credit card declined'); // Should preserve original error message
          
          consoleSpy.mockRestore();
          done();
        } catch (error) {
          consoleSpy.mockRestore();
          done(error);
        }
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);
    });

    test('should handle order save failure scenario properly', async () => {
      // Arrange - Set up successful payment but failed order save
      const mockCart = [
        { _id: 'prod1', name: 'Product 1', price: 29.99 }
      ];
      
      mockReq.body = {
        nonce: 'fake-valid-nonce',
        cart: mockCart
      };

      // Mock successful payment
      mockGateway.transaction.sale.mockImplementation((transactionData, callback) => {
        const result = { 
          success: true, 
          transaction: { id: 'txn_save_fail_test', amount: 29.99 } 
        };
        callback(null, result);
      });

      // Mock order save failure
      const saveError = new Error('Database connection lost');
      mockSave.mockRejectedValue(saveError);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const sendPromise = new Promise((resolve) => {
        mockRes.send = jest.fn((response) => {
          resolve(response);
        });
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);

      // Assert - Should handle order save failures properly
      const response = await sendPromise;
      expect(consoleSpy).toHaveBeenCalledWith(saveError);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(response.success).toBe(false);
      expect(response.message).toBe('Error processing payment');
      expect(response.error).toBe('Database connection lost');
      consoleSpy.mockRestore();
    });

    test('should handle single item cart correctly', (done) => {
      // Arrange - Single item boundary test
      const mockCart = [
        { _id: 'single_prod', name: 'Single Product', price: 15.75 }
      ];
      
      mockReq.body = {
        nonce: 'fake-single-item-nonce',
        cart: mockCart
      };

      mockGateway.transaction.sale.mockImplementation((transactionData, callback) => {
        try {
          // Assert - Verify single item processing
          expect(transactionData.amount).toBe(15.75);
          expect(transactionData.paymentMethodNonce).toBe('fake-single-item-nonce');
          
          callback(null, { success: true, transaction: { id: 'txn_single' } });
        } catch (error) {
          done(error);
        }
      });

      mockRes.json = jest.fn((response) => {
        expect(response.ok).toBe(true);
        done();
      });

      // Act - Call the controller function
      brainTreePaymentController(mockReq, mockRes);
    });
  });
});