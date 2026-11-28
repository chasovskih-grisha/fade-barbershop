import { render, screen, within } from '@testing-library/react';
import { BarberDetailContent } from '../[slug]/BarberDetailContent';
import { getBarberAcrossStudios } from '@/lib/api/studio-directory';
import { getLocations } from '@/lib/api/locations';
import { loadList } from '@/lib/api/http';
import { ok, empty } from '@/lib/api/loadable';

// T-4861a: профіль називає студії, де працює майстер, і кожна назва веде на
// публічну сторінку локації. Без призначень регіон не з'являється.

jest.mock('@/lib/api/locations', () => ({ getLocations: jest.fn(), getFirstActiveLocation: jest.fn() }));
jest.mock('@/lib/api/http', () => ({ loadList: jest.fn(), loadItem: jest.fn() }));

const studio = (code: string, name: string) => ({ code, name });

const barber = (fields: Partial<Parameters<typeof BarberDetailContent>[0]['barber']> = {}) => ({
  id: 'barber-1',
  userId: 'user-1',
  slug: 'taras',
  name: 'Тарас',
  role: 'Майстер-барбер',
  active: true,
  photoUrl: null,
  ...fields,
});

describe('профіль майстра — студії (T-4861a)', () => {
  it('renders one link per assignment with a /locations/{code} href', () => {
    render(
      <BarberDetailContent
        barber={barber({ studios: [studio('KYI-01', 'Fade Kyiv'), studio('LVI-01', 'Fade Lviv')] })}
        services={empty()}
      />
    );

    const region = screen.getByRole('region', { name: /Студії, де працює Тарас/ });
    expect(within(region).getByRole('link', { name: 'Fade Kyiv' })).toHaveAttribute(
      'href',
      '/locations/KYI-01'
    );
    expect(within(region).getByRole('link', { name: 'Fade Lviv' })).toHaveAttribute(
      'href',
      '/locations/LVI-01'
    );
  });

  it('omits the region when the barber has no assignment', () => {
    render(<BarberDetailContent barber={barber()} services={empty()} />);

    expect(screen.queryByRole('region', { name: /Студії/ })).toBeNull();
  });
});

describe('getBarberAcrossStudios (T-4861a)', () => {
  beforeEach(() => jest.clearAllMocks());

  const location = (id: string, code: string, name: string) =>
    ({
      id,
      code,
      name,
      address: `${name}, вул. Тестова 1`,
      addressParts: { street: 'Тестова', building: '1', city: name },
      active: true,
    }) as never;

  it('finds a barber whose only studio is not the first, with both assignments', async () => {
    (getLocations as jest.Mock).mockResolvedValueOnce(
      ok([location('loc-kyiv', 'KYI-01', 'Fade Kyiv'), location('loc-lviv', 'LVI-01', 'Fade Lviv')])
    );
    (loadList as jest.Mock)
      .mockResolvedValueOnce(ok([{ id: 'b1', name: 'Тарас', active: true }]))
      .mockResolvedValueOnce(ok([{ id: 'b2', name: 'Олег', active: true }]));

    // Олег є лише у другій студії — профіль усе одно його знаходить.
    const result = await getBarberAcrossStudios('b2');
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.data.name).toBe('Олег');
    expect(result.data.studios).toEqual([studio('LVI-01', 'Fade Lviv')]);
  });

  it('still resolves an inactive barber so the page can explain it (T-4865a)', async () => {
    (getLocations as jest.Mock).mockResolvedValueOnce(ok([location('loc-kyiv', 'KYI-01', 'Fade Kyiv')]));
    (loadList as jest.Mock).mockResolvedValueOnce(
      ok([{ id: 'b4', name: 'Петро', active: false }])
    );

    // Вимкнений майстер не в довіднику, але профіль його розрішає.
    const result = await getBarberAcrossStudios('b4');
    expect(result.state).toBe('ok');
    if (result.state !== 'ok') return;
    expect(result.data.active).toBe(false);
  });

  it('reports notFound for a person nobody lists', async () => {
    (getLocations as jest.Mock).mockResolvedValueOnce(ok([location('loc-kyiv', 'KYI-01', 'Fade Kyiv')]));
    (loadList as jest.Mock).mockResolvedValueOnce(ok([{ id: 'b1', name: 'Тарас', active: true }]));

    const result = await getBarberAcrossStudios('nobody');
    expect(result.state).toBe('notFound');
  });
});
