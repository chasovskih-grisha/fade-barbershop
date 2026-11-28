import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BookingPage from '../page';
import { partyModeCards } from '../party-flow';
import type { AvailableSlotDto, BarberDto, ServiceDto } from '../types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../hooks/useNearestLocations', () => ({
  // prettier-ignore
  useNearestLocations: () => ({
    data: { city: null, sortedByDistance: false, locations: [{ id: 'loc-1', code: 'LC', name: 'Сіті Лейк', address: 'вул. Тестова', phone: null, distanceKm: null }] },
    loading: false, error: false, status: 'idle', retryGeo: jest.fn(), clearGeo: jest.fn(), refresh: jest.fn(),
  }),
}));
jest.mock('../../components/GeoLocationBanner', () => () => null);

const SERVICES: ServiceDto[] = [
  { id: 'svc-haircut', name: 'Чоловіча стрижка', duration: 50, price: 600 },
  { id: 'svc-party', name: 'Батько + син', duration: 90, price: 900, parallelDuration: 50 },
];
const ANY: BarberDto = { id: '', name: 'Будь-який барбер', any: true };
const PERFORMERS: BarberDto[] = [ANY, { id: 'barber-1', name: 'Олексій' }, { id: 'barber-2', name: 'Дмитро' }];
const ROSTER: BarberDto[] = [...PERFORMERS, { id: 'barber-3', name: 'Тарас' }];
// prettier-ignore
const SLOTS: AvailableSlotDto[] = [
  { start: '11:00', end: '12:00', barbers: ['barber-1', 'barber-2'] },
  { start: '12:00', end: '13:00', barbers: ['barber-1'] },
  { start: '13:00', end: '14:00', barbers: ['barber-1', 'barber-2', 'barber-3'] },
];

let roster = ROSTER;
let slotBodies: Array<Record<string, unknown>> = [];

// prettier-ignore
const respond = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data), headers: new Headers(), text: () => Promise.resolve(JSON.stringify(data)) });

beforeEach(() => {
  roster = ROSTER;
  slotBodies = [];
  // @ts-expect-error - мок global.fetch
  global.fetch = jest.fn((url: string, init?: { body?: string }) => {
    if (url.includes('/booking/slots')) {
      slotBodies.push(JSON.parse(init?.body ?? '{}'));
      return respond(SLOTS);
    }
    if (url.includes('/booking/services/')) return respond(SERVICES);
    if (url.includes('/booking/barbers/')) return respond(url.includes('serviceId=') ? PERFORMERS : roster);
    return respond({ id: 'bk-1' });
  });
});

async function openService(name: string) {
  fireEvent.click(await screen.findByTestId('location-card-loc-1'));
  fireEvent.click(await screen.findByText(name));
  fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
}

describe('Флоу «батько + син» (T-4521c)', () => {
  it('екран 1б показується для пакета: без режиму «Далі» неактивне (PARTY-002)', async () => {
    render(<BookingPage />);
    await openService('Батько + син');

    expect(await screen.findByTestId('party-mode-step')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Далі' })).toBeDisabled();
    fireEvent.click(screen.getByTestId('party-mode-sequential'));
    expect(screen.getByRole('button', { name: 'Далі' })).toBeEnabled();
  });

  it('звичайна послуга минає екран 1б і веде одразу на барберів', async () => {
    render(<BookingPage />);
    await openService('Чоловіча стрижка');
    expect(await screen.findByText('Оберіть барбера')).toBeTruthy();
    expect(screen.queryByTestId('party-mode-step')).toBeNull();
  });

  it('parallel: пара з матриці лишає старти, де обидві ноги вільні (PARTY-WEB-03)', async () => {
    render(<BookingPage />);
    await openService('Батько + син');
    await waitFor(() => expect(screen.getByTestId('party-mode-parallel')).toBeEnabled());
    fireEvent.click(screen.getByTestId('party-mode-parallel'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    expect(await screen.findByTestId('party-pair-step')).toBeTruthy();
    expect(screen.getByTestId('party-pair-any')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('party-pair-barber-3')).toBeDisabled();
    expect(screen.getByRole('link', { name: 'матриця барберів' })).toBeTruthy();
    fireEvent.click(screen.getByTestId('party-pair-barber-1'));
    fireEvent.click(screen.getByTestId('party-pair-barber-2'));
    fireEvent.click(screen.getByRole('button', { name: 'Далі' }));
    expect(await screen.findByText('11:00 – 12:00')).toBeTruthy();
    expect(screen.queryByText('12:00 – 13:00')).toBeNull();
    expect(slotBodies.at(-1)).toMatchObject({ serviceId: 'svc-party', fulfillmentMode: 'parallel' });
  });

  it('один майстер у зміні — parallel disabled із причиною (PARTY-005)', async () => {
    roster = [ANY, { id: 'barber-1', name: 'Олексій' }];
    render(<BookingPage />);
    await openService('Батько + син');
    expect(await screen.findByText(/один майстер у зміні/i)).toBeTruthy();
    expect(screen.getByTestId('party-mode-parallel')).toBeDisabled();
  });

  it('на точці з двома кріслами parallel попереджає про весь зал (PARTY-006)', () => {
    const parallel = partyModeCards({ barbers: 2, chairs: 2 }).find((c) => c.id === 'parallel');
    expect(parallel?.warning).toMatch(/обидва крісла/i);
  });
});
