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
    useAuth.mockReturnValue([{ token: null }]);
    
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('should not call API when no token exists', () => {
    useAuth.mockReturnValue([{ token: null }]);
    
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('should call API when token exists', () => {
    useAuth.mockReturnValue([{ token: 'some-token' }]);
    axios.get.mockResolvedValue({ data: { ok: true } });

    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
  });

  test('should show spinner when API returns unauthorized', () => {
    useAuth.mockReturnValue([{ token: 'invalid-token' }]);
    axios.get.mockResolvedValue({ data: { ok: false } });
    
    render(
      <MemoryRouter>
        <PrivateRoute>
          <div>Secret Content</div>
        </PrivateRoute>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('should show outlet when API succeeds', async () => {
    useAuth.mockReturnValue([{ token: 'valid-token' }]);
    axios.get.mockResolvedValue({ data: { ok: true } });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <PrivateRoute />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

});