// HOU QINGSHAN test file for UpdateProduct

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import UpdateProduct from './UpdateProduct';

// Mock

jest.mock('axios');
jest.mock('react-hot-toast');

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: 'test-product-slug' }), // Provide a mock slug for fetching
}));

// Mock child components
jest.mock('./../../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock('./../../components/AdminMenu', () => () => <div data-testid="admin-menu">Admin Menu</div>);

// Mock Ant Design's Select component for easier testing
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  const Select = ({ children, onChange, placeholder, value }) => (
    <select
      data-testid={`select-${placeholder.replace(/\s+/g, '-').toLowerCase()}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
  return { ...antd, Select };
});

// Define mock data to be used across tests
const mockProduct = {
  _id: 'product123',
  name: 'Old Product Name',
  description: 'Old Description',
  price: 100,
  quantity: 10,
  shipping: true,
  category: { _id: 'cat1', name: 'Electronics' },
};
const mockCategories = [
  { _id: 'cat1', name: 'Electronics' },
  { _id: 'cat2', name: 'Books' },
];


describe('UpdateProduct Component Unit Tests', () => {

  // Before each test, clear all mocks and set up default successful API calls
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/v1/product/get-product/')) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes('/api/v1/category/get-category')) {
        return Promise.resolve({ data: { success: true, category: mockCategories } });
      }
      return Promise.reject(new Error('URL not mocked'));
    });
    // JSDOM doesn't implement createObjectURL, so we mock it
    global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-photo');
  });


  test('fetches product and category data and populates form on mount', async () => {
    render(<UpdateProduct />);
    const nameInput = await screen.findByDisplayValue(mockProduct.name);

    expect(nameInput.value).toBe(mockProduct.name);
    expect(screen.getByPlaceholderText('write a description').value).toBe(mockProduct.description);
    expect(screen.getByPlaceholderText('write a Price').value).toBe(mockProduct.price.toString());
    expect(screen.getByPlaceholderText('write a quantity').value).toBe(mockProduct.quantity.toString());
    expect(screen.getByTestId('select-select-a-category').value).toBe(mockProduct.category._id);

    expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/test-product-slug');
    expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
  });


  describe('handleUpdate', () => {

    test('successfully updates product data and navigates', async () => {
      axios.put.mockResolvedValue({ data: { success: true } });
      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name); // Wait for data to load

      // Simulate user changing the product name
      fireEvent.change(screen.getByPlaceholderText('write a name'), {
        target: { value: 'Updated Product Name' },
      });

      // Simulate clicking the update button
      fireEvent.click(screen.getByRole('button', { name: /UPDATE PRODUCT/i }));

      // Assertions
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/product/update-product/${mockProduct._id}`,
          expect.any(FormData)
        );
      });

      expect(appendSpy).toHaveBeenCalledWith('name', 'Updated Product Name');
      expect(toast.success).toHaveBeenCalledWith('Product Updated Successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
      appendSpy.mockRestore();
    });

    test('sends a new photo in FormData if one is selected', async () => {
      axios.put.mockResolvedValue({ data: { success: true } });
      const appendSpy = jest.spyOn(FormData.prototype, 'append');
      const file = new File(['new-photo-content'], 'new-photo.png', { type: 'image/png' });

      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name);

      // Simulate user uploading a new photo
      fireEvent.change(screen.getByLabelText('Upload Photo'), { target: { files: [file] } });
      fireEvent.click(screen.getByRole('button', { name: /UPDATE PRODUCT/i }));

      await waitFor(() => {
        expect(appendSpy).toHaveBeenCalledWith('photo', file);
      });
      appendSpy.mockRestore();
    });
  });

  describe('handleDelete', () => {
    beforeEach(() => {
      // Mock the global `window.prompt` to control test flow
      global.window.prompt = jest.fn();
    });

    test('deletes product and navigates after user confirmation', async () => {
      window.prompt.mockReturnValue('yes'); // Simulate user confirming the action
      axios.delete.mockResolvedValue({ data: { success: true } });

      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name); // Wait for data to load

      fireEvent.click(screen.getByRole('button', { name: /DELETE PRODUCT/i }));

      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalledWith("Are You Sure want to delete this product ? ");
      });
      expect(axios.delete).toHaveBeenCalledWith(`/api/v1/product/delete-product/${mockProduct._id}`);
      expect(toast.success).toHaveBeenCalledWith('Product Deleted Successfully');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/products');
    });

    test('does not delete product if user cancels the prompt', async () => {
      window.prompt.mockReturnValue(null); // Simulate user clicking "Cancel"

      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name);

      fireEvent.click(screen.getByRole('button', { name: /DELETE PRODUCT/i }));

      // We don't need to wait, but a small delay ensures no async calls are made
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(axios.delete).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('handles network error during deletion and shows error toast', async () => {
      window.prompt.mockReturnValue('yes');
      axios.delete.mockRejectedValue(new Error('Network Error'));

      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name);

      fireEvent.click(screen.getByRole('button', { name: /DELETE PRODUCT/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
    });
  });


  describe('Error Handling and Edge Cases', () => {

    test('handles error during initial data fetch and shows toast', async () => {
      // Mock axios.get to reject, simulating a network failure
      axios.get.mockRejectedValue(new Error('Failed to fetch'));

      render(<UpdateProduct />);

      // Wait for the toast error to be called from the fetchData catch block
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong while fetching data');
      });
    });

    test('handles network error during product update', async () => {
      // Mock axios.put to reject, simulating a network failure
      axios.put.mockRejectedValue(new Error('Network Error'));

      // Set up the component with initial data
      axios.get.mockResolvedValue({ data: { product: mockProduct } });
      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name); // Wait for initial data to load

      // Click the update button
      fireEvent.click(screen.getByRole('button', { name: /UPDATE PRODUCT/i }));

      // Assert that the catch block's toast is shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('something went wrong');
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('handles network error during product deletion', async () => {
      // Mock window.prompt to simulate user confirmation
      window.prompt.mockReturnValue('yes');
      // Mock axios.delete to reject, simulating a network failure
      axios.delete.mockRejectedValue(new Error('Network Error'));

      // Set up the component with initial data
      axios.get.mockResolvedValue({ data: { product: mockProduct } });
      render(<UpdateProduct />);
      await screen.findByDisplayValue(mockProduct.name);

      // Click the delete button
      fireEvent.click(screen.getByRole('button', { name: /DELETE PRODUCT/i }));

      // Assert that the catch block's toast is shown
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

});