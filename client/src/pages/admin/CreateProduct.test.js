// HOU QINGSHAN tests for CreateProduct

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import CreateProduct from './CreateProduct';

// Mock

jest.mock('axios');
jest.mock('react-hot-toast');

// Mock react-router-dom's useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock child components to prevent them from rendering
jest.mock('./../../components/Layout', () => ({ children, title }) => <div data-testid="layout">{children}</div>);
jest.mock('./../../components/AdminMenu', () => () => <div data-testid="admin-menu">Admin Menu</div>);

// Mock Ant Design's Select component for easier testing
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  const Select = ({ children, onChange, placeholder }) => (
    <select
      data-testid={`select-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  return {
    ...antd,
    Select,
  };
});


describe('CreateProduct Component Unit Tests', () => {

  // Clear all mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // JSDOM doesn't implement createObjectURL, so we mock it globally
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-url');
  });

  // Tests for Initial Data Fetching
  test('fetches and displays categories successfully on mount', async () => {
    const mockCategories = [
      { _id: '1', name: 'Electronics' },
      { _id: '2', name: 'Books' },
    ];
    axios.get.mockResolvedValue({
      data: { success: true, category: mockCategories },
    });

    render(<CreateProduct />);

    await waitFor(() => {
      // Check if the API was called correctly
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    // Check if categories are rendered in our mocked select component
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  test('handles API error when fetching categories fails', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));
    render(<CreateProduct />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something wwent wrong in getting catgeory');
    });
  });

  // Tests for Form Input Handling

  test('updates text input state on change', () => {
    render(<CreateProduct />);

    fireEvent.change(screen.getByPlaceholderText('write a name'), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByPlaceholderText('write a description'), { target: { value: 'Product Description' } });
    fireEvent.change(screen.getByPlaceholderText('write a Price'), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText('write a quantity'), { target: { value: '45' } });

    expect(screen.getByPlaceholderText('write a name').value).toBe('New Product');
    expect(screen.getByPlaceholderText('write a description').value).toBe('Product Description');
    expect(screen.getByPlaceholderText('write a Price').value).toBe('123');
    expect(screen.getByPlaceholderText('write a quantity').value).toBe('45');
  });

  test('updates photo state and displays preview on file selection', () => {
    render(<CreateProduct />);
    const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });
    const photoInput = screen.getByLabelText('Upload Photo');

    fireEvent.change(photoInput, { target: { files: [file] } });

    // Check if the label text updated and the image preview is shown
    expect(screen.getByLabelText('photo.png')).toBeInTheDocument();
    expect(screen.getByAltText('product_photo')).toBeInTheDocument();
    expect(screen.getByAltText('product_photo')).toHaveAttribute('src', 'blob:http://localhost/test-url');
  });


  describe('handleCreate function', () => {

    // Helper function to render the component and populate the form
    const setupAndPopulateForm = async () => {
      axios.get.mockResolvedValue({
        data: { success: true, category: [{ _id: 'cat1', name: 'Category 1' }] },
      });

      render(<CreateProduct />);
      await screen.findByText('Category 1'); // Wait for categories to load

      const file = new File(['testfile'], 'test.png', { type: 'image/png' });


      fireEvent.change(screen.getByPlaceholderText('write a name'), { target: { value: 'Test Product' } });
      fireEvent.change(screen.getByPlaceholderText('write a description'), { target: { value: 'A test description' } });
      fireEvent.change(screen.getByPlaceholderText('write a Price'), { target: { value: '99' } });
      fireEvent.change(screen.getByPlaceholderText('write a quantity'), { target: { value: '10' } });
      fireEvent.change(screen.getByLabelText('Upload Photo'), { target: { files: [file] } });
      fireEvent.change(screen.getByTestId('select-select-a-category'), { target: { value: 'cat1' } });
      fireEvent.change(screen.getByTestId('select-select-shipping'), { target: { value: '1' } });

    };

    test('successfully creates a product and navigates on success', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });
      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      await setupAndPopulateForm();
      fireEvent.click(screen.getByRole('button', { name: /CREATE PRODUCT/i }));

      await waitFor(() => {
        // Verify FormData was constructed correctly
        expect(appendSpy).toHaveBeenCalledWith('name', 'Test Product');
      });

      expect(appendSpy).toHaveBeenCalledWith('description', 'A test description');
      expect(appendSpy).toHaveBeenCalledWith('price', '99');
      expect(appendSpy).toHaveBeenCalledWith('quantity', '10');
      expect(appendSpy).toHaveBeenCalledWith('category', 'cat1');
      expect(appendSpy).toHaveBeenCalledWith('shipping', '1');
      expect(appendSpy).toHaveBeenCalledWith('photo', expect.any(File));

      // Verify API call
      expect(axios.post).toHaveBeenCalledWith('/api/v1/product/create-product', expect.any(FormData));

      // Verify user feedback and navigation
      expect(toast.success).toHaveBeenCalledWith('Product Created Successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');

      appendSpy.mockRestore(); // Clean up spy
    });

    test('shows an error toast when API returns success: false', async () => {
      axios.post.mockResolvedValue({
        data: { success: false, message: 'Invalid product data' },
      });

      await setupAndPopulateForm();
      fireEvent.click(screen.getByRole('button', { name: /CREATE PRODUCT/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid product data');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('shows a generic error toast on network or server error', async () => {
      axios.post.mockRejectedValue(new Error('Internal Server Error'));

      await setupAndPopulateForm();
      fireEvent.click(screen.getByRole('button', { name: /CREATE PRODUCT/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('something went wrong');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});