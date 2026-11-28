import { getBarbersByStudio } from '../studio-directory';
import { getLocations, type Location } from '../locations';
import { loadList } from '../http';
import { ok, failed, empty } from '../loadable';

// T-4852a: довідник запитує кожну активну студію, а не першу. Людина з двома
// призначеннями — одна картка з обома назвами; порожня студія не дає блоку;
// збій одного запиту не робить довідник мовчазно неповним.

jest.mock('../locations', () => ({
  getLocations: jest.fn(),
  getFirstActiveLocation: jest.fn(),
}));
jest.mock('../http', () => ({ loadList: jest.fn(), loadItem: jest.fn() }));

const location = (fields: {
  id: string;
  code: string;
  name: string;
  city: string;
}): Location =>
  ({
    ...fields,
    address: `${fields.city}, вул. Тестова 1`,
    addressParts: { street: 'Тестова', building: '1', city: fields.city },
    active: true,
  }) as unknown as Location;

const kyiv = location({ id: 'loc-kyiv', code: 'KYI-01', name: 'Fade Kyiv', city: 'Київ' });
const lviv = location({ id: 'loc-lviv', code: 'LVI-01', name: 'Fade Lviv', city: 'Львів' });

const barberDto = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  ...extra,
});

describe('getBarbersByStudio (T-4852a)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('groups by studio and shows a two-studio person once', async () => {
    (getLocations as jest.Mock).mockResolvedValueOnce(ok([kyiv, lviv]));
    (loadList as jest.Mock)
      .mockResolvedValueOnce(ok([barberDto('b1', 'Тарас'), barberDto('b2', 'Іван')]))
      .mockResolvedValueOnce(ok([barberDto('b1', 'Тарас'), barberDto('b3', 'Олег')]));

    const result = await getBarbersByStudio();

    expect(loadList).toHaveBeenCalledTimes(2);
    expect((loadList as jest.Mock).mock.calls.map((call) => call[0])).toEqual([
      '/booking/barbers/loc-kyiv',
      '/booking/barbers/loc-lviv',
    ]);
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.data.map((studio) => studio.name)).toEqual(['Fade Kyiv', 'Fade Lviv']);
    expect(result.data[0]?.city).toBe('Київ');
    expect(result.data[0]?.barbers.map((barber) => barber.name)).toEqual(['Тарас', 'Іван']);
    // Тарас працює у двох студіях — картка одна, у першій, і називає обидві.
    expect(result.data[1]?.barbers.map((barber) => barber.name)).toEqual(['Олег']);
    expect(result.data[0]?.barbers[0]?.studios).toEqual([
      { code: 'KYI-01', name: 'Fade Kyiv' },
      { code: 'LVI-01', name: 'Fade Lviv' },
    ]);
  });

  it('drops an empty studio, the "any barber" option and an inactive person', async () => {
    (getLocations as jest.Mock).mockResolvedValueOnce(ok([kyiv, lviv]));
    (loadList as jest.Mock)
      .mockResolvedValueOnce(
        ok([barberDto('any', 'Будь-який', { any: true }), barberDto('b4', 'Петро', { active: false })])
      )
      .mockResolvedValueOnce(ok([barberDto('b3', 'Олег')]));

    const result = await getBarbersByStudio();

    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('Fade Lviv');
  });

  it('is empty when no location responds with people, and an error when one request fails', async () => {
    (getLocations as jest.Mock).mockResolvedValueOnce(ok([kyiv]));
    (loadList as jest.Mock).mockResolvedValueOnce(empty());
    expect((await getBarbersByStudio()).state).toBe('empty');

    (getLocations as jest.Mock).mockResolvedValueOnce(ok([kyiv, lviv]));
    (loadList as jest.Mock)
      .mockResolvedValueOnce(ok([barberDto('b1', 'Тарас')]))
      .mockResolvedValueOnce(failed('API 503'));
    const broken = await getBarbersByStudio();
    expect(broken.state).toBe('error');
    if (broken.state !== 'error') return;
    expect(broken.message).toBe('API 503');
  });
});
