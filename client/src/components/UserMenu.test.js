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
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('should display profile and orders links', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
  });

  test('should have correct navigation link paths', () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    );

    const profileLink = screen.getByText('Profile').closest('a');
    const ordersLink = screen.getByText('Orders').closest('a');
    
    expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');
    expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

});