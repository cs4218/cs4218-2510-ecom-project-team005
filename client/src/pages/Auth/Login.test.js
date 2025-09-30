import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));

jest.mock("../../hooks/useCategory", () => jest.fn(() => [])) // Lab 2 solution


  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });




window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };  

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      });
      it('inputs should be initially empty', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
    
        expect(getByText('LOGIN FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email').value).toBe('');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('');
      });
    
      it('should allow typing email and password', () => {
        const { getByText, getByPlaceholderText } = render(
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        );
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
      });
      
    it('should login the user successfully', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                success: true,
                user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                token: 'mockToken'
            }
        });

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith(undefined, {
            duration: 5000,
            icon: '🙏',
            style: {
                background: 'green',
                color: 'white'
            }
        });
    });

    it('should display error message on failed login', async () => {
        axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });

    //new:
    it('should display server error message when success=false', async () => { // for branch coverage metric
        // Technique: Branch coverage (else branch)
        axios.post.mockResolvedValueOnce({
            data: { success: false, message: 'Invalid credentials' }
        });

        const { getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(getByText('LOGIN'));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });

    //new:
    it('should navigate to forgot-password page when link clicked', () => { //statement coverage
        // Technique: Control-flow / link navigation coverage
        const { getByText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.click(getByText('Forgot Password'));
        expect(getByText('Forgot Password Page')).toBeInTheDocument();
    });


    /*
    Technique: Specification-based / property testing:
     */

    it('should have email input with type=email and required attribute', () => {
        // Technique: Specification-based / property testing
        const { getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        const emailInput = getByPlaceholderText('Enter Your Email');
        expect(emailInput).toHaveAttribute('type', 'email');
        expect(emailInput).toHaveAttribute('required');
    });

    it('should have password input with type=password and required attribute', () => {
        // Technique: Specification-based / property testing
        const { getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                </Routes>
            </MemoryRouter>
        );

        const passwordInput = getByPlaceholderText('Enter Your Password');
        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveAttribute('required');
    });


});
