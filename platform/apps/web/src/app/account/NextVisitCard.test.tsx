import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextVisitCard } from './NextVisitCard';
import type { ExtendedAppointment } from '@/lib/api/appointments';

const nextVisit: ExtendedAppointment = {
  id: 'v1',
  date: '2026-12-04',
  startTime: '14:00',
  endTime: '15:00',
  serviceName: 'Стрижка',
  barberName: 'Олександр',
  locationName: 'Центр',
  price: 600,
  status: 'confirmed',
  referenceId: null,
  referenceComment: '',
  canEditReference: true,
  deposit: null,
};

describe('NextVisitCard (T-4716b)', () => {
  it('показує найближчий візит і веде на сторінку візитів', () => {
    render(<NextVisitCard visit={nextVisit} />);
    expect(screen.getByText('Найближчий візит')).toBeInTheDocument();
    expect(screen.getByText(/14:00–15:00/)).toBeInTheDocument();
    expect(screen.getByText('Стрижка • Олександр • Центр')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Деталі' })).toHaveAttribute(
      'href',
      '/account/appointments'
    );
  });

  it('показує бейдж-попередження для візиту, що очікує депозит', () => {
    render(
      <NextVisitCard visit={{ ...nextVisit, deposit: { amount: 200, freeCancelUntil: null } }} />
    );
    expect(screen.getByText('Очікує депозиту')).toBeInTheDocument();
  });

  it('без майбутнього візиту показує порожній рядок і «Записатися»', () => {
    render(<NextVisitCard visit={null} />);
    expect(screen.getByText('Немає найближчого візиту')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Записатися' })).toHaveAttribute('href', '/booking');
  });
});
