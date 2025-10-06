import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Kalau App pakai react-router, ganti render(<App />)
// menjadi render(<MemoryRouter><App /></MemoryRouter>)
test('renders App without crashing', () => {
  render(<App />);
  expect(document.body).toBeInTheDocument();
});
