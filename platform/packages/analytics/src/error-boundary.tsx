import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from './telemetry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'UnknownComponent';
    Logger.error(`ErrorBoundary caught an error in ${componentName}`, { component: componentName }, error);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error!, { componentStack: '' });
        }
        return this.props.fallback;
      }

      return (
        <div role="alert" aria-live="assertive" style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#be123c' }}>Something went wrong.</h2>
          <p style={{ color: '#374151', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
            We encountered an unexpected error in this section. Our telemetry team has been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#09090b',
              color: '#ffffff',
              border: 'none',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
