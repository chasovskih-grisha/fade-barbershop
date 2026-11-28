// T-4616b: позначка недоступності з календаря надсилає те, що чекає
// POST /admin/barbers/:id/unavailability — ISO-межі й необов'язкову локацію.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BarberUnavailabilityForm } from './BarberUnavailabilityForm';

const barbers = [{ id: 'barber-1', name: 'Олег' }];
const locations = [{ id: 'loc-1', name: 'Центр' }];

function mockFetch(body: unknown = { conflictsCreated: 2 }) {
  const fetchMock = jest.fn(async () => ({ ok: true, status: 201, json: async () => body }));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('BarberUnavailabilityForm (T-4616b)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('шле межі інтервалу й локацію, а потім каже, скільки візитів на рішенні', async () => {
    const fetchMock = mockFetch();
    const onCreated = jest.fn();
    render(
      <BarberUnavailabilityForm barbers={barbers} locations={locations} onCreated={onCreated} />
    );

    await userEvent.selectOptions(screen.getByLabelText('Барбер'), 'barber-1');
    await userEvent.selectOptions(screen.getByLabelText('Локація'), 'loc-1');
    await userEvent.type(screen.getByLabelText('Початок недоступності'), '2026-11-27T09:00');
    await userEvent.type(screen.getByLabelText('Кінець недоступності'), '2026-11-27T12:00');
    await userEvent.type(screen.getByLabelText('Причина'), 'лікар');
    await userEvent.click(screen.getByText('Позначити'));

    await waitFor(() => expect(screen.getByText(/візитів на рішення: 2/)).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/admin/barbers/barber-1/unavailability');
    expect(JSON.parse(String(init.body))).toEqual({
      locationId: 'loc-1',
      start: new Date('2026-11-27T09:00').toISOString(),
      end: new Date('2026-11-27T12:00').toISOString(),
      reason: 'лікар',
    });
    expect(onCreated).toHaveBeenCalled();
  });

  it('не шле запит без барбера', async () => {
    const fetchMock = mockFetch();
    render(<BarberUnavailabilityForm barbers={barbers} locations={locations} />);

    expect(screen.getByText('Позначити')).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('без барберів форма не малюється', () => {
    const { container } = render(<BarberUnavailabilityForm barbers={[]} locations={locations} />);

    expect(container).toBeEmptyDOMElement();
  });
});
