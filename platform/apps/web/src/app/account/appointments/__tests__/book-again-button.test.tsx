import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookAgainButton } from '../BookAgainButton';

const intentOf = (over: Record<string, unknown> = {}) => ({
  location: { id: 'loc-1', name: 'Центр', stale: false },
  service: { id: 'svc-1', name: 'Стрижка', stale: false },
  barber: { id: 'bar-1', name: 'Олег', stale: false },
  price: 700,
  ...over,
});

function mockFetch(intent: unknown) {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(intent) } as Response)
  ) as unknown as typeof fetch;
}

describe('BookAgainButton (T-4617b)', () => {
  afterEach(() => jest.resetAllMocks());

  it('opens the booking flow with the valid fields', async () => {
    mockFetch(intentOf());
    const navigate = jest.fn();
    render(<BookAgainButton appointmentId="apt-1" navigate={navigate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Записатися знову' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/booking?location=loc-1&service=svc-1&barber=bar-1')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/appointments/apt-1/book-again'),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('says what changed when a field is no longer valid', async () => {
    mockFetch(intentOf({ barber: { id: 'bar-1', name: 'Олег', stale: true } }));
    const navigate = jest.fn();
    render(<BookAgainButton appointmentId="apt-1" navigate={navigate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Записатися знову' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith('/booking?location=loc-1&service=svc-1')
    );
    expect(screen.getByRole('alert')).toHaveTextContent('барбер більше не виконує цю послугу');
  });

  it('shows an error and does not navigate when the intent fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response)
    ) as unknown as typeof fetch;
    const navigate = jest.fn();
    render(<BookAgainButton appointmentId="apt-1" navigate={navigate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Записатися знову' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося'));
    expect(navigate).not.toHaveBeenCalled();
  });
});
