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

const renderCard = (v: CalendarVisit = visit(), onDone = jest.fn()) =>
  render(<VisitCard visit={v} onDone={onDone} />);

describe('VisitCard: статуси і команди', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('shows status-gated actions: booked gets confirm/cancel/reschedule, in_progress only complete', () => {
    const { unmount } = renderCard(visit({ status: 'booked' }));
    expect(screen.getByRole('button', { name: 'Підтвердити' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Скасувати' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Перенести' })).toBeInTheDocument();
    unmount();
    renderCard(visit({ status: 'in_progress' }));
    expect(screen.getByRole('button', { name: 'Завершити' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Підтвердити' })).not.toBeInTheDocument();
  });

  it('terminal statuses expose no actions and no comment editor', () => {
    renderCard(visit({ status: 'completed' }));
    expect(screen.queryByRole('button', { name: 'Підтвердити' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Коментар/)).not.toBeInTheDocument();
    expect(screen.getByText(/термінальному статусі/)).toBeInTheDocument();
  });

  it('confirm posts the lifecycle command with admin actor and reloads', async () => {
    const onDone = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'confirmed' }),
    });
    renderCard(visit(), onDone);
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/admin/appointments/apt-1/confirm');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({});
  });

  it('maps 409 to a conflict message without reloading', async () => {
    const onDone = jest.fn();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({}),
    });
    renderCard(visit(), onDone);
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert').textContent).toContain('Слот зайнятий');
    expect(onDone).not.toHaveBeenCalled();
  });
});
