import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { TextField } from './TextField';

describe('TextField Component', () => {
  it('renders label, input, help text, and handles typing', () => {
    const handleChange = jest.fn();
    render(
      <TextField
        label="Phone Number"
        placeholder="+380..."
        help="Enter your mobile number"
        onChange={handleChange}
      />
    );

    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Enter your mobile number')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('+380...');
    fireEvent.change(input, { target: { value: '+380501234567' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders error state and error message', () => {
    render(
      <TextField
        label="Email"
        error="Invalid email address"
        defaultValue="bad-email"
      />
    );

    const input = screen.getByDisplayValue('bad-email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });
});
