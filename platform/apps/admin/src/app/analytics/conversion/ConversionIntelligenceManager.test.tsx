import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversionIntelligenceManager } from './ConversionIntelligenceManager';

describe('ConversionIntelligenceManager', () => {
  const mockMetrics = {
    totalVisits: 100,
    completedVisits: 80,
    cancelledVisits: 10,
    occupancyRate: 75,
    completionRate: 80,
    activeBarbersCount: 5,
    activeLocationsCount: 2,
    totalRevenue: 50000,
    barberPerformance: [],
  };

  it('renders conversion intelligence dashboard and metrics correctly', () => {
    render(<ConversionIntelligenceManager metrics={mockMetrics} />);
    expect(screen.getByText(/Центр конверсійної інтелектуальності/i)).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument(); // Overall conversion
    expect(screen.getByText(/22%/)).toBeInTheDocument(); // Abandoned checkout
    expect(screen.getByText(/64%/)).toBeInTheDocument(); // Repeat customer
  });

  it('allows changing attribution model', () => {
    render(<ConversionIntelligenceManager metrics={mockMetrics} />);
    const select = screen.getByDisplayValue(/Last-Click/i);
    fireEvent.change(select, { target: { value: 'linear' } });
    expect(screen.getByDisplayValue(/Linear/i)).toBeInTheDocument();
  });
});
