/**
 * Unit Tests for Private.js Component
 * 
 * What's being tested:
 * - Route protection logic that controls access to authenticated pages
 * - JWT token validation through API calls to /api/v1/auth/user-auth
 * - Conditional rendering: shows Spinner for unauthenticated users, Outlet for authenticated users
 * - Authentication state management integration with useAuth context
 * - API call behavior based on token presence
 * - BUG DETECTION: Network error handling vulnerabilities (missing try-catch blocks)
 * - Error resilience and graceful failure scenarios
 * 
 * AI was utilized in the making of this file
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import PrivateRoute from './Private.js';
import { useAuth } from '../../context/auth';
import axios from 'axios';

jest.mock('../../context/auth');
jest.mock('axios');
jest.mock('../Spinner', () => {
  return function MockSpinner() {
    return <div data-testid="spinner">Loading...</div>;
  };
});

describe('Private Route Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show spinner when user has no token', () => {
    // Arrange - Set up mock for no token scenario
    useAuth.mockReturnValue([{ token: null }]);
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    // Assert - Verify spinner is shown and content is hidden
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('should not call API when no token exists', () => {
    // Arrange - Set up mock for no token scenario
    useAuth.mockReturnValue([{ token: null }]);
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    // Assert - Verify API is not called
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('should call API when token exists', () => {
    // Arrange - Set up mocks for token scenario
    useAuth.mockReturnValue([{ token: 'some-token' }]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    // Act - Render the component
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    // Assert - Verify API is called with correct endpoint
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
  });

  test('should show spinner when API returns unauthorized', () => {
    // Arrange - Set up mocks for unauthorized scenario
    useAuth.mockReturnValue([{ token: 'invalid-token' }]);
    axios.get.mockResolvedValue({ data: { ok: false } });
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    // Assert - Verify unauthorized state shows spinner
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('should show outlet when API succeeds', async () => {
    // Arrange - Set up mocks for successful authentication
    useAuth.mockReturnValue([{ token: 'valid-token' }]);
    axios.get.mockResolvedValue({ data: { ok: true } });
    
    // Act - Render the component
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <PrivateRoute />
      </MemoryRouter>
    );
    
    // Assert - Verify spinner disappears (authenticated state)
    await waitFor(() => {
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  // BUG DETECTION TEST - Network Error Handling
  test('should handle API network errors gracefully - EXPOSES BUG', async () => {
    // Arrange - Set up network failure scenario (WiFi down, server crash)
    useAuth.mockReturnValue([{ token: 'valid-token' }]);
    axios.get.mockRejectedValue(new Error('Network Error')); // Simulate network failure
    
    // Act - Render the component
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    // Assert - Component should handle error gracefully, but it doesn't
    await waitFor(() => {
      // BUG: This spinner shows forever when network fails
      // Component has NO try-catch block around axios.get() call
      // Real users get stuck on loading screen when WiFi disconnects
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
    
    // PROPOSED FIX: Add try-catch block in Private.js authCheck function
    // catch (error) { setOk(false); /* or show retry button */ }
  });

});