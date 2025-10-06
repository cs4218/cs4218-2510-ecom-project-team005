import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Profile from './Profile';
jest.mock('axios');

test('submit update profile', async () => {
  axios.put.mockResolvedValueOnce({ data: { ok: true }});

  render(<Profile />);

  const name = screen.queryByLabelText(/name/i) || screen.getByPlaceholderText(/name/i);
  const pass = screen.queryByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);

  fireEvent.change(name, { target: { value: 'Ridwan' }});
  fireEvent.change(pass, { target: { value: '123456' }});

  const btn = screen.queryByRole('button', { name: /save|update/i }) || screen.getByText(/save|update/i);
  fireEvent.click(btn);

  await waitFor(() => expect(axios.put).toHaveBeenCalled());
});
