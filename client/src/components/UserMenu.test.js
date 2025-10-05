/**
 * Unit Tests for UserMenu.js Component
 * 
 * - Static navigation menu content rendering (Dashboard title, Profile/Orders links)
 * - Navigation link attributes and href paths for user dashboard routes
 * - Component structure and text content display
 * - React Router integration for user navigation menu
 * - UI element accessibility through text-based assertions
 * 
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from './UserMenu.js';

describe('User Menu Test Suite', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display dashboard title', () => {
    // Arrange - No setup needed for static content
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    // Assert - Verify dashboard title is displayed
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('should display profile and orders links', () => {
    // Arrange - No setup needed for static content
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
    
    // Assert - Verify navigation links are present
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  test('should have correct navigation link paths', () => {
    // Arrange - No setup needed for static content
    
    // Act - Render component and get link elements
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByText('Profile').closest('a');
    const ordersLink = screen.getByText('Orders').closest('a');
    
    // Assert - Verify link paths are correct
    expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');
    expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

});