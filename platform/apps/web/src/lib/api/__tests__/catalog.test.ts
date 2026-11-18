// Тести catalog.ts (web): withLocation-гейт через /locations, мапінг барберів,
// слоти, помилки. fetch мокається послідовно: /locations → ендпоінт.
import { getServices, getBarbersForService, getSlotsForService } from '../catalog';
import type { LoadableList } from '../loadable';

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const LOCATIONS = jsonResponse([
  { id: 'loc_KYY_01', code: 'KYY-01', name: 'FADE Podil', active: true },
]);

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

/** Черга відповідей: перша — /locations, решта — цільовий ендпоінт. */
let responses: Response[] = [];
const mockApi = (...next: Response[]) => {
  responses = [LOCATIONS, ...next];
  fetchMock.mockImplementation(async () => {
    const [first, ...rest] = responses;
    if (rest.length > 0) responses = rest;
    if (!first) throw new Error('порожня черга відповідей');
    return first;
  });
};
/** data у стані ok (звуження union для asserted-доступу). */
const okData = <T>(result: LoadableList<T>) => {
  expect(result.state).toBe('ok');
  return result.state === 'ok' ? result.data : [];
};

describe('getServices', () => {
  it('повертає каталог з ціною першої активної локації', async () => {
    mockApi(
      jsonResponse([
        { id: '1', name: 'Стрижка', duration: 60, price: 200 },
        { id: '2', name: 'Гоління', duration: 30, price: 100 },
      ])
    );
    const data = okData(await getServices());

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ name: 'Стрижка', duration: 60 });
  });

  it('без локацій — empty (не error)', async () => {
    responses = [jsonResponse([])];
    fetchMock.mockImplementation(async () => jsonResponse([]));
    const result = await getServices();
    expect(result.state).toBe('empty');
  });
});

describe('getBarbersForService', () => {
  it('фільтрує «Будь-який барбер» і мапить slug', async () => {
    mockApi(
      jsonResponse([
        { id: 'barber-1', name: 'Олександр' },
        { id: 'barber-2', name: 'Іван' },
        { id: '', name: 'Будь-який барбер', any: true },
      ])
    );
    const data = okData(await getBarbersForService('service-123'));

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ id: 'barber-1', name: 'Олександр', slug: 'barber-1' });
  });

  it('лише «Будь-який барбер» — empty', async () => {
    mockApi(jsonResponse([{ id: '', name: 'Будь-який барбер', any: true }]));
    const result = await getBarbersForService('service-123');
    expect(result.state).toBe('empty');
  });
});

describe('getSlotsForService', () => {
  it('повертає слоти на дату', async () => {
    mockApi(
      jsonResponse([
        { start: '09:00', end: '10:00', barbers: ['barber-1'] },
        { start: '10:00', end: '11:00', barbers: [] },
      ])
    );
    const data = okData(await getSlotsForService('service-123', '2024-01-15'));

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ start: '09:00', barbers: ['barber-1'] });
    expect(data[1]?.barbers).toHaveLength(0);
  });

  it('fetch-помилка → error', async () => {
    mockApi(jsonResponse({ message: 'boom' }, 500));
    const result = await getSlotsForService('service-123', '2024-01-15');
    expect(result.state).toBe('error');
  });
});
