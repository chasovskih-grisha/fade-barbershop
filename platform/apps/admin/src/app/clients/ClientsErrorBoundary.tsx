'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error & { digest?: string };
}

export class ClientsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error & { digest?: string }): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error & { digest?: string }, errorInfo: ErrorInfo) {
    console.error('[FADE_CLIENTS_TELEMETRY_ERROR]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-card border border-border bg-surface-raised text-fg my-6 shadow-sm">
          <div className="max-w-lg mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-semantic-danger/15 text-red-600 dark:bg-semantic-danger/20 dark:text-semantic-danger font-bold text-xl">
              !
            </div>
            <h3 className="text-xl font-bold">
              Помилка завантаження клієнтів / Clients Directory Error
            </h3>
            <p className="text-sm text-fg-muted">
              Система телеметрії FADE зафіксувала збій під час рендерингу бази клієнтів. Дані кешу та зрізи збережено.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-surface-sunken rounded text-xs font-mono text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded hover:bg-interactive-hover transition-colors"
              >
                Оновити сторінку / Reload Directory
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
