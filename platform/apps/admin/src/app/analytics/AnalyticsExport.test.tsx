import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsExport } from './AnalyticsExport';
import type { AnalyticsMetrics, AnalyticsFiltersState } from './analytics-types';

describe('AnalyticsExport', () => {
  const mockMetrics: AnalyticsMetrics = {
    totalVisits: 10,
    completedVisits: 8,
    cancelledVisits: 2,
    occupancyRate: 75,
    completionRate: 80,
    activeBarbersCount: 2,
    activeLocationsCount: 1,
    totalRevenue: 4000,
    barberPerformance: [{ barberId: 'b1', barberName: 'Олександр', visitsCount: 5, revenue: 2500 }],
  };

  const mockFilters: AnalyticsFiltersState = {
    period: 'day',
    locationId: 'all',
    barberId: 'all',
  };

  it('рендерить крій експорту та кнопки', () => {
    render(<AnalyticsExport metrics={mockMetrics} filters={mockFilters} />);
    expect(screen.getByText('Експорт звітності')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Експортувати звіт у форматі CSV' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Експортувати звіт у форматі JSON' })
    ).toBeInTheDocument();
  });

  it('викликає createObjectURL при кліку на експорт', () => {
    const createObjectURLSpy = jest.fn().mockReturnValue('blob:url');
    window.URL.createObjectURL = createObjectURLSpy;

    render(<AnalyticsExport metrics={mockMetrics} filters={mockFilters} />);

    fireEvent.click(screen.getByRole('button', { name: 'Експортувати звіт у форматі CSV' }));
    expect(createObjectURLSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Експортувати звіт у форматі JSON' }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
  });
});
