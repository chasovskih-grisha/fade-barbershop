import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BarbersErrorBoundary from '../error';

describe('BarbersErrorBoundary', () => {
  it('renders error message and reset button', () => {
    const mockReset = jest.fn();
    const error = new Error('Failed to fetch barbers') as Error & { digest?: string };
    error.digest = 'TEST_DIGEST_123';

    render(<BarbersErrorBoundary error={error} reset={mockReset} />);

    expect(screen.getByText('Не вдалося завантажити майстрів')).toBeInTheDocument();
    expect(screen.getByText(/Спробуйте ще раз/)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Спробувати ще раз/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
