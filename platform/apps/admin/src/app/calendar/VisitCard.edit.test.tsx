import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import VisitCard from './VisitCard';
import type { CalendarVisit } from './visit-status';

jest.spyOn(console, 'error').mockImplementation(() => {});

const visit = (overrides: Partial<CalendarVisit> = {}): CalendarVisit => ({
  id: 'apt-1',
  bookingId: 'b-1',
  appointmentId: 'apt-1',
  locationId: 'loc-1',
  barberId: 'barber-1',
  start: '2026-09-28T10:00:00.000Z',
  end: '2026-09-28T11:00:00.000Z',
  status: 'booked',
  serviceId: null,
  agreedPrice: 600,
  partyId: null,
  partyRole: null,
  haircutReferenceId: null,
  referencePhotoUrl: null,
  comment: null,
  source: 'web',
  clientId: null,
  ...overrides,
});

describe('VisitCard: перенесення і коментар', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('reschedule form posts date/start/end and closes after success', async () => {
    const onDone = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'booked' }),
    });
    render(<VisitCard visit={visit()} onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Перенести' }));
    fireEvent.change(screen.getByLabelText('Дата'), { target: { value: '2026-10-05' } });
    fireEvent.change(screen.getByLabelText('Початок'), { target: { value: '12:00' } });
    fireEvent.change(screen.getByLabelText('Кінець'), { target: { value: '12:30' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Перенести запис' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/admin/appointments/apt-1/reschedule');
    // prettier-ignore
    expect(JSON.parse(init.body)).toEqual({ date: '2026-10-05', start: '12:00', end: '12:30' });
  });

  it('saves the comment via reference endpoint for booked visits', async () => {
    const onDone = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'booked' }),
    });
    render(<VisitCard visit={visit({ comment: 'стара примітка' })} onDone={onDone} />);
    fireEvent.change(screen.getByLabelText(/Коментар/), { target: { value: 'зняти на 2 мм' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти коментар' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/admin/appointments/apt-1/reference');
    expect(JSON.parse(init.body)).toMatchObject({ comment: 'зняти на 2 мм' });
  });
});
