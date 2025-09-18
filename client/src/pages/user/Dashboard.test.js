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
    const mockUser = {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St'
    };
    useAuth.mockReturnValue([{ user: mockUser }]);
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  test('should render layout and user menu', () => {
    useAuth.mockReturnValue([{ user: null }]);
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  test('should handle missing user data gracefully', () => {
    useAuth.mockReturnValue([{ user: null }]);
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

});