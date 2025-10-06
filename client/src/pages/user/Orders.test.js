/* eslint-env jest */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Orders from './Orders';
jest.mock('axios');

test('menampilkan daftar orders', async () => {
  axios.get.mockResolvedValueOnce({ data: [{ _id:'o1', status:'Created' }]});
  render(<Orders />);
  await waitFor(() => expect(screen.getByText(/created/i)).toBeInTheDocument());
});
