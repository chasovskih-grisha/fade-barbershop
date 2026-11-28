import { render, screen } from '@testing-library/react';
import BarbersPage from '../page';
import * as directoryApi from '@/lib/api/studio-directory';

jest.mock('@/lib/api/studio-directory');

describe('BarbersPage', () => {
  it('renders barbers list when available', async () => {
    jest.spyOn(directoryApi, 'getBarbersByStudio').mockResolvedValueOnce({
      state: 'ok',
      data: [
        {
          code: 'KYI-01',
          name: 'Fade Kyiv',
          city: 'Київ',
          barbers: [
            {
              id: 'barber-1',
              userId: 'user-1',
              slug: 'alex',
              name: 'Олександр',
              role: 'barber',
              active: true,
              photoUrl: null,
            },
          ],
        },
      ],
    });

    const jsx = await BarbersPage();
    const { container } = render(jsx);

    expect(screen.getByText('Архітектори вашого стилю')).toBeInTheDocument();
    expect(screen.getByText('Олександр')).toBeInTheDocument();

    const scriptTag = container.querySelector('script[type="application/ld+json"]');
    expect(scriptTag).toBeInTheDocument();
    if (scriptTag?.textContent) {
      const jsonLd = JSON.parse(scriptTag.textContent);
      expect(jsonLd['@type']).toBe('ItemList');
      expect(jsonLd.itemListElement[0].item.name).toBe('Олександр');
    }
  });

  it('renders empty state when no barbers', async () => {
    jest.spyOn(directoryApi, 'getBarbersByStudio').mockResolvedValueOnce({
      state: 'empty',
    });

    const jsx = await BarbersPage();
    render(jsx);

    expect(screen.getByText('Команда ще формується')).toBeInTheDocument();
    // T-4614e: без активної локації порожній каталог не веде на /booking.
    expect(screen.queryByRole('link', { name: 'Записатися' })).toBeNull();
  });
});
