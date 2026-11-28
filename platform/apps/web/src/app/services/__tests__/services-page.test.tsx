import { render, screen } from '@testing-library/react';
import ServicesPage from '../page';
import * as catalogApi from '@/lib/api/catalog';

jest.mock('@/lib/api/catalog');
// ErrorState → RetryAction — клієнтський useRouter; у RSC-тесті його підміняємо.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe('ServicesPage', () => {
  it('renders services list and JSON-LD structured data when available', async () => {
    jest.spyOn(catalogApi, 'getServices').mockResolvedValueOnce({
      state: 'ok',
      data: [
        {
          id: 'svc-1',
          name: 'Чоловіча стрижка',
          duration: 45,
          price: 600,
          description: 'Класична стрижка з миттям та укладкою',
        },
      ],
    });

    const jsx = await ServicesPage();
    const { container } = render(jsx);

    expect(screen.getByText('Послуги та фіксований прайс')).toBeInTheDocument();
    expect(screen.getAllByText('Чоловіча стрижка').length).toBeGreaterThan(0);

    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag).toBeInTheDocument();
    if (scriptTag?.textContent) {
      const jsonLd = JSON.parse(scriptTag.textContent);
      expect(jsonLd['@type']).toBe('ItemList');
      expect(jsonLd.itemListElement[0].item.name).toBe('Чоловіча стрижка');
    }
  });

  it('renders a live error state with retry when the catalog API fails', async () => {
    jest.spyOn(catalogApi, 'getServices').mockResolvedValueOnce({
      state: 'error',
      message: 'Каталог послуг недоступний. Спробуйте за кілька хвилин.',
    });

    const jsx = await ServicesPage();
    const { container } = render(jsx);

    expect(screen.getByText('Послуги та фіксований прайс')).toBeInTheDocument();
    expect(screen.getByRole('alert').textContent).toContain('Каталог послуг недоступний');
    expect(screen.getByRole('button', { name: 'Спробувати ще раз' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Записатися онлайн' })).toBeNull();
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('renders empty state when no services', async () => {
    jest.spyOn(catalogApi, 'getServices').mockResolvedValueOnce({
      state: 'empty',
    });

    const jsx = await ServicesPage();
    const { container } = render(jsx);

    expect(screen.getByText('Послуг ще немає')).toBeInTheDocument();
    // T-4614e: без активної локації порожній каталог не веде на /booking.
    expect(screen.queryByRole('link', { name: 'Записатися онлайн' })).toBeNull();
    expect(screen.queryByText('Послуги та фіксований прайс')).toBeNull();
    expect(screen.queryByRole('link', { name: /Скористатися знижкою/ })).toBeNull();
    expect(container.textContent).not.toContain('₴');
  });
});
