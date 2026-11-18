import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversionFunnelHeatmap } from './ConversionFunnelHeatmap';
import type { AnalyticsMetrics } from '../analytics-types';

const mockMetrics: AnalyticsMetrics = {
  totalVisits: 100,
  completedVisits: 75,
  cancelledVisits: 5,
  occupancyRate: 80,
  completionRate: 75,
  activeBarbersCount: 4,
  activeLocationsCount: 2,
  totalRevenue: 50000,
  barberPerformance: [],
};

describe('ConversionFunnelHeatmap', () => {
  it('renders funnel heatmap steps and recommendations correctly', () => {
    render(<ConversionFunnelHeatmap metrics={mockMetrics} />);

    expect(screen.getByText('Теплова карта воронки конверсій (ANL-HEAT-03)')).toBeInTheDocument();
    expect(screen.getByText('Перегляд головної / Послуг (Landing View)')).toBeInTheDocument();
    expect(screen.getByText('Вибір майстра (Barber Selection)')).toBeInTheDocument();
    expect(screen.getByText('Вибір часу (Slot & Calendar Selection)')).toBeInTheDocument();
    expect(screen.getByText('Рекомендація Conversion Intelligence')).toBeInTheDocument();
  });

  it('allows changing device filter', () => {
    render(<ConversionFunnelHeatmap metrics={mockMetrics} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'mobile' } });

    expect(select).toHaveValue('mobile');
    expect(screen.getByText('8,400')).toBeInTheDocument();
  });
});
