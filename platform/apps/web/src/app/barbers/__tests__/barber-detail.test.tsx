import { render, screen } from '@testing-library/react';
import BarberDetailPage from '../[slug]/page';
import * as staffApi from '@/lib/api/staff';

jest.mock('@/lib/api/staff', () => ({
  getBarberBySlug: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('notFound');
  }),
}));

describe('BarberDetailPage', () => {
  const mockBarber = {
    id: 'barber-1',
    slug: 'taras-shevchenko',
    name: 'Тарас Шевченко',
    role: 'Top Barber',
    bio: 'Експерт з класичних та сучасних стрижок з досвідом понад 7 років.',
    experience: '7 років',
    specialties: ['Fade', 'Борода', 'Класика'],
    photoUrl: '/images/barbers/taras.jpg',
  };

  test('renders barber details, specialties, and JSON-LD when found', async () => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({
      state: 'ok',
      data: mockBarber,
    });

    const ui = await BarberDetailPage({ params: Promise.resolve({ slug: 'taras-shevchenko' }) });
    const { container } = render(ui);

    expect(screen.getByText('Тарас Шевченко')).toBeInTheDocument();
    expect(screen.getByText('Top Barber')).toBeInTheDocument();
    expect(screen.getByText(/Експерт з класичних/)).toBeInTheDocument();
    expect(screen.getByText('Fade')).toBeInTheDocument();
    expect(screen.getByText('Відгуки клієнтів')).toBeInTheDocument();

    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag).toBeInTheDocument();
    expect(scriptTag!.textContent).toContain('Person');
    expect(scriptTag!.textContent).toContain('HairSalon');
  });

  test('does not invent a rating or reviews before public reviews exist', async () => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({
      state: 'ok',
      data: mockBarber,
    });

    const ui = await BarberDetailPage({ params: Promise.resolve({ slug: 'taras-shevchenko' }) });
    const { container } = render(ui);

    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag!.textContent).not.toContain('AggregateRating');
    expect(scriptTag!.textContent).not.toContain('"Review"');
    expect(screen.getByText(/Відгуків ще немає/)).toBeInTheDocument();
  });

  test('renders a truthful page when the profile has no bio, experience or specialties', async () => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({
      state: 'ok',
      data: {
        id: 'barber-2',
        slug: 'barber-2',
        name: 'Іван',
        role: 'Майстер-барбер',
        photoUrl: null,
      },
    });

    const ui = await BarberDetailPage({ params: Promise.resolve({ slug: 'barber-2' }) });
    render(ui);

    expect(screen.getByText('Іван')).toBeInTheDocument();
    expect(screen.queryByText('Досвід роботи')).toBeNull();
    expect(screen.queryByText('Спеціалізації та навички')).toBeNull();
  });

  test('calls notFound when barber is missing', async () => {
    (staffApi.getBarberBySlug as jest.Mock).mockResolvedValueOnce({
      state: 'error',
      error: 'Not found',
    });

    await expect(
      BarberDetailPage({ params: Promise.resolve({ slug: 'unknown' }) })
    ).rejects.toThrow('notFound');
  });
});
