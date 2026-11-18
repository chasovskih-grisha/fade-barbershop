import { render, screen } from '@testing-library/react';
import { AnalyticsPeakHours } from './AnalyticsPeakHours';

describe('AnalyticsPeakHours', () => {
  it('рендерить пікові години та розподіл записів', () => {
    const visits = [
      { id: '1', start: '2026-11-10T10:00:00', end: '2026-11-10T11:00:00', status: 'completed', barberId: 'b1', locationId: 'l1', agreedPrice: 500 },
      { id: '2', start: '2026-11-10T14:00:00', end: '2026-11-10T15:00:00', status: 'completed', barberId: 'b1', locationId: 'l1', agreedPrice: 500 },
      { id: '3', start: '2026-11-10T18:00:00', end: '2026-11-10T19:00:00', status: 'completed', barberId: 'b1', locationId: 'l1', agreedPrice: 500 },
    ];

    render(<AnalyticsPeakHours visits={visits} />);
    expect(screen.getByText('Пікові години навантаження')).toBeInTheDocument();
    expect(screen.getByText('Ранок (09:00 – 12:00)')).toBeInTheDocument();
    expect(screen.getByText('День (12:00 – 16:00)')).toBeInTheDocument();
    expect(screen.getByText('Вечір (16:00 – 21:00)')).toBeInTheDocument();
    expect(screen.getAllByText('1 записів').length).toBe(3);
  });
});
