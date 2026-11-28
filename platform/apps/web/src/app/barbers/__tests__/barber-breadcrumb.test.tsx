import { render, screen, within } from '@testing-library/react';
import BarbersPage from '../page';
import BarberDetailPage from '../[slug]/page';
import * as staffApi from '@/lib/api/staff';
import * as directoryApi from '@/lib/api/studio-directory';
import * as catalogApi from '@/lib/api/catalog';
import { ok } from '@/lib/api/loadable';
import type { Barber } from '@/lib/api/staff';

// T-4863: список і профіль майстра малюють один видимий ланцюжок.
// Список: Головна → Майстри (поточна — текст). Профіль додає імʼя, а
// «← Усі майстри» більше не існує. Тест рендерить обидві справжні сторінки.

jest.mock('@/lib/api/staff', () => ({ getBarberBySlug: jest.fn() }));
jest.mock('@/lib/api/studio-directory');
jest.mock('@/lib/api/catalog', () => ({ getServices: jest.fn() }));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('notFound');
  }),
}));

const barber: Barber = {
  id: 'barber-1',
  userId: 'user-1',
  slug: 'taras',
  name: 'Тарас',
  role: 'Top Barber',
  active: true,
  photoUrl: null,
};

describe('Barber breadcrumb (T-4863)', () => {
  it('listing ends on «Майстри» as the current page', async () => {
    (directoryApi.getBarbersByStudio as jest.Mock).mockResolvedValueOnce(
      ok([{ code: 'KYI-01', name: 'Fade Kyiv', city: 'Київ', barbers: [barber] }])
    );
    render(await BarbersPage());

    const nav = screen.getByRole('navigation', { name: 'Навігаційний ланцюжок' });
    expect(within(nav).getByRole('link', { name: 'Головна' }).getAttribute('href')).toBe('/');
    expect(within(nav).getByText('Майстри').getAttribute('aria-current')).toBe('page');
    expect(within(nav).queryByRole('link', { name: 'Майстри' })).toBeNull();
  });

  it('profile adds the person and links back to the listing', async () => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({ state: 'ok', data: barber });
    (catalogApi.getServices as jest.Mock).mockResolvedValueOnce(ok([]));
    const ui = await BarberDetailPage({ params: Promise.resolve({ slug: 'taras' }) });
    render(ui);

    const nav = screen.getByRole('navigation', { name: 'Навігаційний ланцюжок' });
    expect(within(nav).getByRole('link', { name: 'Майстри' }).getAttribute('href')).toBe('/barbers');
    expect(within(nav).getByText('Тарас').getAttribute('aria-current')).toBe('page');
    expect(screen.queryByText(/Усі майстри/)).toBeNull();
  });
});
