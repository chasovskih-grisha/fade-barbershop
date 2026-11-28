import { render, screen } from '@testing-library/react';
import BarberDetailPage from '../[slug]/page';
import * as staffApi from '@/lib/api/staff';
import * as catalogApi from '@/lib/api/catalog';
import { ok } from '@/lib/api/loadable';
import type { Barber } from '@/lib/api/staff';

// T-4860: профіль майстра — одна колонка в порядку портрет → імʼя → студії →
// послуги → портфоліо → відгуки → дії, тієї ж ширини, що й список. Тест
// рендерить справжню сторінку й читає порядок регіонів із DOM, а не з коду.

jest.mock('@/lib/api/staff', () => ({ getBarberBySlug: jest.fn() }));
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
  photoUrl: '/images/taras.jpg',
  experience: '7 років',
  specialties: ['Fade'],
  portfolioThumbUrl: '/images/taras-work.jpg',
};

const services = ok([
  { id: 's1', name: 'Стрижка машинкою', duration: 40, price: 600 },
  { id: 's2', name: 'Стрижка ножицями', duration: 50, price: 0 },
]);

async function renderPage(data: Barber) {
  (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({ state: 'ok', data });
  (catalogApi.getServices as jest.Mock).mockResolvedValueOnce(services);
  const ui = await BarberDetailPage({ params: Promise.resolve({ slug: data.slug }) });
  return render(ui);
}

const regions = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll('[data-region]')).map((n) => n.getAttribute('data-region') ?? '');

describe('BarberDetailPage layout (T-4860)', () => {
  test('renders the regions in one column, portrait first and actions last', async () => {
    const { container } = await renderPage(barber);

    expect(regions(container)).toEqual([
      'portrait',
      'name',
      'services',
      'portfolio',
      'reviews',
      'actions',
      'book-mobile',
    ]);

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('max-w-container');
    expect(root.className).toContain('flex-col');
    expect(root.className).toContain('pb-28');
  });

  test('states the services of the location with their prices, and does not invent one', async () => {
    await renderPage(barber);

    expect(screen.getByText('Стрижка машинкою')).toBeInTheDocument();
    expect(screen.getByText('600 ₴')).toBeInTheDocument();
    expect(screen.getByText('Ціна уточнюється')).toBeInTheDocument();
  });

  test('keeps the book control on screen below the wide breakpoint', async () => {
    const { container } = await renderPage(barber);

    const sticky = container.querySelector('[data-region="book-mobile"]') as HTMLElement;
    expect(sticky.className).toContain('fixed');
    expect(sticky.className).toContain('bottom-0');
    expect(sticky.className).toContain('md:hidden');
    const link = Array.from(sticky.querySelectorAll('a')).find((n) =>
      n.textContent?.includes('Записатися до майстра'));
    expect(link?.getAttribute('href')).toBe('/booking?barber=barber-1');
  });

  test('an empty portfolio renders no gradient tiles and keeps the order', async () => {
    const { container } = await renderPage({ ...barber, portfolioThumbUrl: null });

    expect(regions(container)).toEqual([
      'portrait',
      'name',
      'services',
      'portfolio',
      'reviews',
      'actions',
      'book-mobile',
    ]);
    expect(container.querySelector('[class*="gradient"]')).toBeNull();
    expect(screen.getByText(/Роботи майстра/)).toBeInTheDocument();
  });

  test('a failed catalogue is a state, not an empty page', async () => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({ state: 'ok', data: barber });
    (catalogApi.getServices as jest.Mock).mockResolvedValueOnce({
      state: 'error',
      message: 'Каталог послуг недоступний. Спробуйте за кілька хвилин.',
    });
    const ui = await BarberDetailPage({ params: Promise.resolve({ slug: barber.slug }) });
    render(ui);

    expect(screen.getByRole('heading', { name: 'Тарас' })).toBeInTheDocument();
    expect(screen.getByText(/Каталог послуг недоступний/)).toBeInTheDocument();
  });
});
