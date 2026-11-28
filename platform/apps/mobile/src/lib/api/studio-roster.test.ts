import { fetchBarbersByStudio } from './studio-roster';
import { fetchBarbers } from './barbers';
import { fetchLocations } from './locations';

jest.mock('./barbers', () => {
  const actual = jest.requireActual('./barbers');
  return { ...actual, fetchBarbers: jest.fn() };
});
jest.mock('./locations', () => ({ fetchLocations: jest.fn() }));

const location = (id: string, name: string, active = true) =>
  ({ id, code: id.toUpperCase(), name, active }) as never;

const barber = (id: string, name: string, extra: Record<string, unknown> = {}) =>
  ({ id, name, ...extra }) as never;

describe('fetchBarbersByStudio (T-4852b)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders two studios as two groups and a shared barber once', async () => {
    (fetchLocations as jest.Mock).mockResolvedValueOnce([
      location('loc-kyiv', 'Fade Kyiv'),
      location('loc-lviv', 'Fade Lviv'),
    ]);
    (fetchBarbers as jest.Mock)
      .mockResolvedValueOnce([barber('b1', 'Тарас'), barber('b2', 'Іван')])
      .mockResolvedValueOnce([barber('b1', 'Тарас'), barber('b3', 'Олег')]);

    const result = await fetchBarbersByStudio();

    expect((fetchBarbers as jest.Mock).mock.calls.map((call) => call[0])).toEqual([
      'loc-kyiv',
      'loc-lviv',
    ]);
    expect(result.map((studio) => studio.name)).toEqual(['Fade Kyiv', 'Fade Lviv']);
    expect(result[0]?.barbers.map((b) => b.name)).toEqual(['Тарас', 'Іван']);
    expect(result[1]?.barbers.map((b) => b.name)).toEqual(['Олег']);
  });

  it('drops a studio with no listed barbers and an inactive master', async () => {
    (fetchLocations as jest.Mock).mockResolvedValueOnce([
      location('loc-kyiv', 'Fade Kyiv'),
      location('loc-lviv', 'Fade Lviv'),
    ]);
    (fetchBarbers as jest.Mock)
      .mockResolvedValueOnce([barber('b4', 'Петро', { active: false })])
      .mockResolvedValueOnce([barber('b3', 'Олег')]);

    const result = await fetchBarbersByStudio();

    expect(result.map((studio) => studio.name)).toEqual(['Fade Lviv']);
  });

  it('skips an inactive location', async () => {
    (fetchLocations as jest.Mock).mockResolvedValueOnce([
      location('loc-kyiv', 'Fade Kyiv', false),
      location('loc-lviv', 'Fade Lviv'),
    ]);
    (fetchBarbers as jest.Mock).mockResolvedValueOnce([barber('b3', 'Олег')]);

    const result = await fetchBarbersByStudio();

    expect(fetchBarbers).toHaveBeenCalledTimes(1);
    expect(result.map((studio) => studio.name)).toEqual(['Fade Lviv']);
  });
});
