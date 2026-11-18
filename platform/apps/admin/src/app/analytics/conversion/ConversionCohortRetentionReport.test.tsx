import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversionCohortRetentionReport } from './ConversionCohortRetentionReport';

describe('ConversionCohortRetentionReport', () => {
  const mockMetrics = {
    totalVisits: 1000,
    completedVisits: 850,
    cancelledVisits: 50,
    occupancyRate: 80,
    completionRate: 85,
    activeBarbersCount: 6,
    activeLocationsCount: 2,
    totalRevenue: 120000,
    barberPerformance: [],
  };

  it('renders cohort retention report and table correctly', () => {
    render(<ConversionCohortRetentionReport metrics={mockMetrics} />);
    expect(screen.getByText(/Когортний аналіз утримання/i)).toBeInTheDocument();
    expect(screen.getByText(/Жовтень 2026/i)).toBeInTheDocument();
    expect(screen.getAllByText(/68%/).length).toBeGreaterThan(0);
  });

  it('allows switching segment', () => {
    render(<ConversionCohortRetentionReport metrics={mockMetrics} />);
    const select = screen.getByDisplayValue(/Усі клієнти/i);
    fireEvent.change(select, { target: { value: 'vip' } });
    expect(screen.getByDisplayValue(/VIP Клієнти/i)).toBeInTheDocument();
  });
});
