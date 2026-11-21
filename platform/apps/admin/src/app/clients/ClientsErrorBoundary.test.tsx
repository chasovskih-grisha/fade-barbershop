import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClientsErrorBoundary } from './ClientsErrorBoundary';

describe('ClientsErrorBoundary', () => {
  const ThrowingComponent = () => {
    throw new Error('Test client telemetry failure');
  };

  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });
  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('renders error fallback and logs telemetry when child throws', () => {
    render(
      <ClientsErrorBoundary>
        <ThrowingComponent />
      </ClientsErrorBoundary>
    );

    expect(screen.getByText(/Помилка завантаження клієнтів/i)).toBeInTheDocument();
    expect(screen.getByText(/Test client telemetry failure/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      '[FADE_CLIENTS_TELEMETRY_ERROR]',
      expect.objectContaining({
        message: 'Test client telemetry failure',
      })
    );
  });

  test('renders children normally when no error occurs', () => {
    render(
      <ClientsErrorBoundary>
        <div>Normal Clients Content</div>
      </ClientsErrorBoundary>
    );

    expect(screen.getByText('Normal Clients Content')).toBeInTheDocument();
  });
});
