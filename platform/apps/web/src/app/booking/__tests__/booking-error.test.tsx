import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookingErrorBoundary from '../error';

describe('BookingErrorBoundary', () => {
  it('renders error message, support touchpoints and handles reset', () => {
    const resetMock = jest.fn();
    const testError = new Error('Test booking error');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<BookingErrorBoundary error={testError} reset={resetMock} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Помилка оформлення запису/i)).toBeInTheDocument();
    expect(screen.getByText(/Консьєрж у Telegram/i)).toBeInTheDocument();
    expect(screen.getByText(/Зателефонувати/i)).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[FADE_BOOKING_ERROR_BOUNDARY]',
      expect.objectContaining({
        message: 'Test booking error',
        scope: 'booking_funnel',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /Спробувати знову/i }));
    expect(resetMock).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
