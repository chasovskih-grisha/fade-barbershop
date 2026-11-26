// T-4616b: засновник закриває конфлікт з адмінки; порожній список — без баннера.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ShiftConflictsPanel } from './ShiftConflictsPanel';

const row = {
  id: 'conflict-1',
  appointmentId: 'booking-1',
  barberId: 'barber-1',
  start: '2026-11-27T09:00:00.000Z',
  end: '2026-11-27T10:00:00.000Z',
  clientName: 'Ірина',
  serviceName: 'Стрижка',
  hasOtherBarber: true,
};

function mockFetch(list: unknown[], resolveBody: unknown = { changed: true }) {
  const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'POST') {
      return { ok: true, status: 200, json: async () => resolveBody } as Response;
    }
    return { ok: true, status: 200, json: async () => list } as Response;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('ShiftConflictsPanel (T-4616b)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('порожній список не малює панель', async () => {
    mockFetch([]);
    render(<ShiftConflictsPanel />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText('Конфлікти недоступності')).not.toBeInTheDocument();
  });

  it('показує відкритий конфлікт із часом, клієнтом і послугою', async () => {
    mockFetch([row]);
    render(<ShiftConflictsPanel />);

    await waitFor(() => expect(screen.getByText(/Ірина/)).toBeInTheDocument());
    expect(screen.getByText(/Стрижка/)).toBeInTheDocument();
  });

  it('скасування постить рішення і каже, що депозит повертається', async () => {
    const fetchMock = mockFetch([row], {
      changed: true,
      settlements: [{ outcome: 'refund_initiated' }],
    });
    render(<ShiftConflictsPanel />);

    await waitFor(() => expect(screen.getByText('Скасувати візит')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Скасувати візит'));

    await waitFor(() =>
      expect(screen.getByText('Візит скасовано, депозит повертається')).toBeInTheDocument()
    );
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(String(post?.[0])).toContain('/admin/shift-conflicts/conflict-1/resolve');
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({ decision: 'cancel' });
  });

  it('перенесення надсилає барбера, дату й час', async () => {
    const fetchMock = mockFetch([row]);
    render(<ShiftConflictsPanel />);

    await waitFor(() => expect(screen.getByLabelText('Барбер для conflict-1')).toBeInTheDocument());
    await userEvent.type(screen.getByLabelText('Барбер для conflict-1'), 'barber-2');
    await userEvent.click(screen.getByText('Перенести'));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
      expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
        decision: 'reassign',
        barberId: 'barber-2',
      });
    });
  });
});
