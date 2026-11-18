import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarbersErrorBoundary } from './BarbersErrorBoundary';

describe('BarbersErrorBoundary', () => {
  const ThrowingComponent = () => {
    throw new Error('Test barbers telemetry failure');
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
      <BarbersErrorBoundary>
        <ThrowingComponent />
      </BarbersErrorBoundary>
    );

    expect(screen.getByText(/Помилка завантаження бази барберів/i)).toBeInTheDocument();
    expect(screen.getByText(/Test barbers telemetry failure/i)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      '[FADE_BARBERS_TELEMETRY_ERROR]',
      expect.objectContaining({
        message: 'Test barbers telemetry failure',
      })
    );
  });

  test('renders children normally when no error occurs', () => {
    render(
      <BarbersErrorBoundary>
        <div>Normal Barbers Content</div>
      </BarbersErrorBoundary>
    );

    expect(screen.getByText('Normal Barbers Content')).toBeInTheDocument();
  });
});
