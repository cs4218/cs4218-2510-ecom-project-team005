import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

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

jest.mock("../../hooks/useCategory", () => jest.fn(() => [])); //Mock the get on useCategory

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
      

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your favorite sport'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Registered Successfully, please login');
  });

  it('should display error message on failed registration', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your favorite sport'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

    it('should allow typing in inputs', () => {
        const { getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
        fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
        fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
        fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
        fireEvent.change(getByPlaceholderText('What is Your favorite sport'), { target: { value: 'Football' } });

        expect(getByPlaceholderText('Enter Your Name').value).toBe('John Doe');
        expect(getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('password123');
        expect(getByPlaceholderText('Enter Your Phone').value).toBe('1234567890');
        expect(getByPlaceholderText('Enter Your Address').value).toBe('123 Street');
        expect(getByPlaceholderText('Enter Your DOB').value).toBe('2000-01-01');
        expect(getByPlaceholderText('What is Your favorite sport').value).toBe('Football');
    });


    it('inputs should be initially empty', () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('REGISTER FORM')).toBeInTheDocument();

        expect(getByPlaceholderText('Enter Your Name').value).toBe('');
        expect(getByPlaceholderText('Enter Your Email').value).toBe('');
        expect(getByPlaceholderText('Enter Your Password').value).toBe('');
        expect(getByPlaceholderText('Enter Your Phone').value).toBe('');
        expect(getByPlaceholderText('Enter Your Address').value).toBe('');
        expect(getByPlaceholderText('Enter Your DOB').value).toBe('');
        expect(getByPlaceholderText('What is Your favorite sport').value).toBe('');
    });


    it('renders register form', () => {
        const { getByText, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        expect(getByText('REGISTER FORM')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
        expect(getByPlaceholderText('What is Your favorite sport')).toBeInTheDocument();
    });

    //new:
    /* Technique: Branch coverage (server-side rejection / else branch)
   Purpose: cover the case where request succeeds (HTTP) but res.data.success === false
*/
    it('branch: shows server message when res.data.success is false', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User exists' } });

        const { getByRole, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText(/Enter Your Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Email/i), { target: { value: 'dup@example.com' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Password/i), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Phone/i), { target: { value: '1234567890' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Address/i), { target: { value: '123 Street' } });
        fireEvent.change(getByPlaceholderText(/Enter Your DOB/i), { target: { value: '2000-01-01' } });
        fireEvent.change(getByPlaceholderText(/What is Your favorite sport/i), { target: { value: 'Football' } });

        fireEvent.click(getByRole('button', { name: /register/i }));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('User exists');
    });



    it('spec: calls axios.post with the correct payload', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const payload = {
            name: 'Alice',
            email: 'alice@example.com',
            password: 'securePass',
            phone: '0987654321',
            address: 'Somewhere 1',
            DOB: '1990-05-05',
            answer: 'Tennis'
        };

        const { getByRole, getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText(/Enter Your Name/i), { target: { value: payload.name } });
        fireEvent.change(getByPlaceholderText(/Enter Your Email/i), { target: { value: payload.email } });
        fireEvent.change(getByPlaceholderText(/Enter Your Password/i), { target: { value: payload.password } });
        fireEvent.change(getByPlaceholderText(/Enter Your Phone/i), { target: { value: payload.phone } });
        fireEvent.change(getByPlaceholderText(/Enter Your Address/i), { target: { value: payload.address } });
        fireEvent.change(getByPlaceholderText(/Enter Your DOB/i), { target: { value: payload.DOB } });
        fireEvent.change(getByPlaceholderText(/What is Your favorite sport/i), { target: { value: payload.answer } });

        fireEvent.click(getByRole('button', { name: /register/i }));

        await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
        expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', payload);
    });


    /* Technique: Branch coverage / Decision-table
   Purpose: ensure success branch actually navigates to /login
*/
    it('branch: on success navigates to /login', async () => {
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const { getByRole, getByPlaceholderText, getByText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<div>LOGIN ROUTE</div>} />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.change(getByPlaceholderText(/Enter Your Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Password/i), { target: { value: 'password123' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Phone/i), { target: { value: '1234567890' } });
        fireEvent.change(getByPlaceholderText(/Enter Your Address/i), { target: { value: '123 Street' } });
        fireEvent.change(getByPlaceholderText(/Enter Your DOB/i), { target: { value: '2000-01-01' } });
        fireEvent.change(getByPlaceholderText(/What is Your favorite sport/i), { target: { value: 'Football' } });

        fireEvent.click(getByRole('button', { name: /register/i }));

        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        await waitFor(() => expect(getByText('LOGIN ROUTE')).toBeInTheDocument());
    });


    /* Technique: Specification-based / Defensive
   Purpose: detect odd DOB type (component currently uses type="Date" which is suspicious)
*/
    it('spec: DOB input exists, required, and has a type attribute', () => {
        const { getByPlaceholderText } = render(
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );

        const dob = getByPlaceholderText(/Enter Your DOB/i);
        expect(dob).toBeTruthy();
        expect(dob).toHaveAttribute('required');

        // If you want to *fail* when type !== 'date' (strict check), change to:
         expect(dob).toHaveAttribute('type', 'date');
        // For now we assert a type exists so we catch removal/mistype
      //  expect(dob.getAttribute('type')).toBeTruthy();
    });
});
