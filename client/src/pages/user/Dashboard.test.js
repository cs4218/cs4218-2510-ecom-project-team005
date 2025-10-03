/**
 * Unit Tests for Dashboard.js Component
 * 
 * What's being tested:
 * - User profile information display (name, email, address) from auth context
 * - Component structure rendering with Layout and UserMenu components
 * - Graceful handling of missing or null user data
 * - Integration with useAuth hook for user state management
 * - Static content rendering and component composition
 * - BUG DETECTION: XSS security vulnerabilities (unsanitized user input rendering)
 * - BUG DETECTION: Undefined display issues (missing fallback values)
 * - Data validation and safe user content display
 * 
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard.js';
import { useAuth } from '../../context/auth';

jest.mock('../../context/auth');
jest.mock('../../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return <div data-testid="layout" title={title}>{children}</div>;
  };
});
jest.mock('../../components/UserMenu', () => {
  return function MockUserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

describe('User Dashboard Test Suite', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display user information when auth data exists', () => {
    // Arrange - Set up mock user data
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St'
    };
    useAuth.mockReturnValue([{ user: mockUser }]);
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Assert - Verify user data is displayed correctly
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  test('should render layout and user menu', () => {
    // Arrange - Set up mock with no user data
    useAuth.mockReturnValue([{ user: null }]);
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Assert - Verify core components are rendered
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  test('should handle missing user data gracefully', () => {
    // Arrange - Set up mock with null user
    useAuth.mockReturnValue([{ user: null }]);
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Assert - Verify component doesn't crash with missing data
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  // BUG DETECTION TEST - XSS Security Vulnerability
  test('should handle malicious user data safely - EXPOSES SECURITY BUG', () => {
    // Arrange - Malicious user data with script injection attempts
    const maliciousUser = {
      name: '<script>alert("XSS Attack!")</script>Hacker',
      email: '<img src=x onerror=alert("Email XSS")>fake@evil.com',
      address: 'javascript:alert("Address XSS")'
    };
    useAuth.mockReturnValue([{ user: maliciousUser }]);
    
    // Act - Render the component with malicious data
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Assert - Component should sanitize HTML and now it does (bug fixed!)
    const container = screen.getByTestId('layout');
    
    // FIXED: HTML/JavaScript is now sanitized before rendering
    // XSS (Cross-Site Scripting) vulnerability has been patched
    // Script tags are stripped, preventing malicious code execution
    expect(container.innerHTML).not.toContain('<script>'); // Script tags should be removed
    expect(container.innerHTML).toContain('alert("XSS Attack!")Hacker'); // Clean text should remain
    
    // PROPOSED FIX: Use text content instead of innerHTML in Dashboard.js
    // Replace: <h3>{auth?.user?.name}</h3>
    // With: <h3>{auth?.user?.name ? String(auth.user.name).replace(/<[^>]*>/g, '') : ''}</h3>
    // Or use a proper HTML sanitization library like DOMPurify
  });

  // BUG DETECTION TEST - Undefined Display Bug  
  test('should handle undefined user fields gracefully - EXPOSES DISPLAY BUG', () => {
    // Arrange - User with missing fields (incomplete profile)
    const incompleteUser = {
      name: 'John Doe'
      // email and address missing
    };
    useAuth.mockReturnValue([{ user: incompleteUser }]);
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Assert - Component should show default values and now it does (bug fixed!)
    // FIXED: React now displays friendly messages when fields are missing
    // Users see helpful text "Not provided" instead of confusing "undefined"
    const container = screen.getByTestId('layout');
    expect(container.innerHTML).not.toContain('undefined'); // "undefined" should not appear
    expect(container.innerHTML).toContain('Email not provided'); // Should show friendly message
    expect(container.innerHTML).toContain('Address not provided'); // Should show friendly message
    
    // PROPOSED FIX: Add fallback values
    // <h3>{auth?.user?.email || 'Email not provided'}</h3>
    // <h3>{auth?.user?.address || 'Address not provided'}</h3>
  });

});