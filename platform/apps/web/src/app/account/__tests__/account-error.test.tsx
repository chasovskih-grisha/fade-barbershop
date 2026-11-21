import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountErrorBoundary from '../error';

describe('AccountErrorBoundary', () => {
  it('renders account error message, navigation actions and handles reset', () => {
    const resetMock = jest.fn();
    const testError = new Error('Test account error');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AccountErrorBoundary error={testError} reset={resetMock} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Помилка кабінету клієнта/i)).toBeInTheDocument();
    expect(screen.getByText(/Повторний вхід/i)).toBeInTheDocument();
    expect(screen.getByText(/Підтримка/i)).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[FADE_ACCOUNT_ERROR_BOUNDARY]',
      expect.objectContaining({
        message: 'Test account error',
        scope: 'client_account',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /Спробувати знову/i }));
    expect(resetMock).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });
});
