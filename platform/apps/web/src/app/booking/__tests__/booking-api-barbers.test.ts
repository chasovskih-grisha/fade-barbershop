// Крок 2 флоу запису (T-4521): `listBarbers` додає `?serviceId=`, коли послугу
// обрано, тож сервер звужує список до барберів цієї послуги.
import { listBarbers } from '../bookingApi';
import type { BarberDto } from '../types';

const BARBERS: BarberDto[] = [
  { id: '', name: '', any: true },
  { id: 'b1', name: 'Олексій' },
];

describe('bookingApi.listBarbers — matrix query (T-4521)', () => {
  beforeEach(() => {
    // prettier-ignore
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(BARBERS) })) as unknown as typeof fetch;
  });
  afterEach(() => jest.restoreAllMocks());

  it('додає serviceId, коли послугу обрано', async () => {
    await listBarbers('loc-1', 'svc-1');
    expect(global.fetch).toHaveBeenCalledWith('/booking/barbers/loc-1?serviceId=svc-1');
  });

  it('без послуги запит без query', async () => {
    await listBarbers('loc-1');
    expect(global.fetch).toHaveBeenCalledWith('/booking/barbers/loc-1');
  });
});
