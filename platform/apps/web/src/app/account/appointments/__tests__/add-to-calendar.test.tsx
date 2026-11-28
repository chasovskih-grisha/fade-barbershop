import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { AddToCalendar } from '../AddToCalendar';

function visit(overrides: Partial<ExtendedAppointment> = {}): ExtendedAppointment {
  return {
    id: 'appointment-1',
    date: '2026-07-15',
    startTime: '12:00',
    endTime: '13:00',
    startsAt: '2026-07-15T09:00:00.000Z',
    endsAt: '2026-07-15T10:00:00.000Z',
    serviceName: 'Стрижка',
    barberName: 'Олексій',
    locationName: 'FADE Сіті',
    price: 600,
    status: 'upcoming',
    referenceId: null,
    referenceComment: '',
    canEditReference: true,
    canBookAgain: true,
    deposit: null,
    ...overrides,
  };
}

describe('AddToCalendar (T-4446b)', () => {
  it('links the visit calendar file and a dated Google Calendar event', () => {
    render(<AddToCalendar app={visit()} />);

    expect(screen.getByRole('link', { name: '.ics' })).toHaveAttribute(
      'href',
      '/api/appointments/appointment-1/calendar'
    );
    const google = screen.getByRole('link', { name: 'Google' });
    expect(google.getAttribute('href')).toContain('dates=20260715T090000Z%2F20260715T100000Z');
    expect(google).toHaveAttribute('target', '_blank');
    const params = new URL(String(google.getAttribute('href'))).searchParams;
    expect(params.get('text')).toBe('FADE · Стрижка');
    expect(params.get('location')).toBe('FADE Сіті');
  });

  it('hides the links when the visit is cancelled', () => {
    const { container } = render(<AddToCalendar app={visit({ status: 'cancelled' })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without absolute visit times', () => {
    const legacy = visit();
    delete legacy.startsAt;
    delete legacy.endsAt;

    const { container } = render(<AddToCalendar app={legacy} />);

    expect(container).toBeEmptyDOMElement();
  });
});
