import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { Text } from 'react-native';

function ThrowError(): JSX.Element {
  throw new Error('Test telemetry error');
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <Text>Normal content</Text>
      </ErrorBoundary>
    );
    expect(screen.getByText('Normal content')).toBeTruthy();
  });

  it('renders fallback UI and logs telemetry when error occurs', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Щось пішло не так')).toBeTruthy();
    expect(screen.getByText('Test telemetry error')).toBeTruthy();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[FADE_MOBILE_ERROR_BOUNDARY]',
      expect.objectContaining({
        message: 'Test telemetry error',
      })
    );

    consoleErrorSpy.mockRestore();
  });
});
