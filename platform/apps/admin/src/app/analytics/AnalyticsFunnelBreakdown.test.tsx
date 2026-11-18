import { render, screen } from '@testing-library/react';
import { AnalyticsFunnelBreakdown } from './AnalyticsFunnelBreakdown';
import type { AnalyticsMetrics } from './analytics-types';

describe('AnalyticsFunnelBreakdown', () => {
  it('рендерить кроки воронки конверсії бронювання', () => {
    const mockMetrics: AnalyticsMetrics = {
      totalVisits: 10,
      completedVisits: 8,
      cancelledVisits: 2,
      occupancyRate: 80,
      completionRate: 80,
      activeBarbersCount: 3,
      activeLocationsCount: 2,
      totalRevenue: 5000,
      barberPerformance: [],
    };

    render(<AnalyticsFunnelBreakdown metrics={mockMetrics} />);
    expect(screen.getByText('Воронка конверсії онлайн-бронювання')).toBeInTheDocument();
    expect(screen.getByText('1. Початок бронювання (Booking Started)')).toBeInTheDocument();
    expect(screen.getByText('2. Вибір послуги (Service Selected)')).toBeInTheDocument();
    expect(screen.getByText('3. Вибір часу (Slot Selected)')).toBeInTheDocument();
    expect(screen.getByText('4. Підтвердження (Confirmed / Completed)')).toBeInTheDocument();
  });
});
