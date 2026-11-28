// T-4477a: мапінг барберів для публічних сторінок не вигадує профіль.
// Регрес-тест «однакова біографія для всіх барберів неможлива»: у Barber
// більше немає жодного поля біографії/досвіду, яке можна було б підставити
// всім; фото приходить із реального API, а не з хардкод-мапи.
import { getBarberBySlug, getBarbers } from '../staff';
import type { LoadableList } from '../loadable';
import type { Barber } from '../staff';

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

const okData = (result: LoadableList<Barber>): Barber[] => {
  expect(result.state).toBe('ok');
  return result.state === 'ok' ? result.data : [];
};

describe('getBarbers (T-4477a)', () => {
  it('не додає вигаданої біографії, досвіду чи спеціалізацій', async () => {
    mockApi(
      jsonResponse([
        { id: '', name: 'Будь-який барбер', any: true },
        { id: 'barber-1', name: 'Олександр' },
      ])
    );

    const [barber] = okData(await getBarbers());
    expect(barber!.name).toBe('Олександр');
    expect(barber).not.toHaveProperty('bio');
    expect(barber).not.toHaveProperty('experience');
    expect(barber).not.toHaveProperty('specialties');
  });

  it('бере фото з реальної відповіді API', async () => {
    mockApi(
      jsonResponse([
        {
          id: 'barber-1',
          name: 'Олександр',
          photo: { url: '/media/barbers/1.jpg', alt: 'Олександр', width: 400, height: 500 },
        },
      ])
    );

    const [barber] = okData(await getBarbers());
    expect(barber!.photoUrl).toBe('/media/barbers/1.jpg');
  });

  it('без фото віддає null, а не вигадане посилання', async () => {
    mockApi(jsonResponse([{ id: 'barber-1', name: 'Олександр', photo: null }]));

    const [barber] = okData(await getBarbers());
    expect(barber!.photoUrl).toBeNull();
  });
});

describe('T-4865a: вимкнений майстер', () => {
  it('довідник не показує майстра з active: false', async () => {
    mockApi(
      jsonResponse([
        { id: 'barber-1', name: 'Олександр' },
        { id: 'barber-2', name: 'Ігор', active: false },
      ])
    );

    const names = okData(await getBarbers()).map((barber) => barber.name);
    expect(names).toEqual(['Олександр']);
  });

  it('пряме відкриття знаходить вимкненого майстра', async () => {
    mockApi(jsonResponse([{ id: 'barber-2', name: 'Ігор', active: false }]));

    const result = await getBarberBySlug('barber-2');
    expect(result.state).toBe('ok');
    expect(result.state === 'ok' && result.data.active).toBe(false);
  });

  it('без прапорця майстер лишається видимим', async () => {
    mockApi(jsonResponse([{ id: 'barber-1', name: 'Олександр' }]));

    const [barber] = okData(await getBarbers());
    expect(barber!.active).toBe(true);
  });
});
