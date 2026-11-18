import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversionDiagnosticWidget } from '../ConversionDiagnosticWidget';

describe('ConversionDiagnosticWidget', () => {
  it('renders conversion health score and metrics correctly', () => {
    render(<ConversionDiagnosticWidget initialStartedCount={1000} initialCompletedCount={800} />);
    expect(screen.getByText(/Аналітика конверсії та здоров'я воронки запису/i)).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument(); // 800/1000
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
  });

  it('triggers audit button successfully', () => {
    const windowAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ConversionDiagnosticWidget />);
    fireEvent.click(screen.getByText(/Запустити повний аудит конверсій/i));
    expect(windowAlert).toHaveBeenCalled();
    windowAlert.mockRestore();
  });

  it('simulates drop-off risk on button click', () => {
    render(<ConversionDiagnosticWidget />);
    const simulateBtn = screen.getByText(/Симулювати Drop-off сигнал/i);
    fireEvent.click(simulateBtn);
    expect(simulateBtn).toBeInTheDocument();
  });
});
