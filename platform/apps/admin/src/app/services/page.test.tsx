import { render, screen } from '@testing-library/react';
import ServicesPage from './page';

// Сторінка послуг — тонкий рендер ServicesManager (дані фетчить менеджер,
// cookie-сесію перевіряє AdminShell у layout). Тест менеджера живе поруч.
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('ServicesPage', () => {
  it('рендерить менеджер послуг (заголовок з ServicesManager)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 's1',
          name: 'Батько + син',
          description: null,
          category: 'Package',
          duration: 90,
          parallelDuration: 50,
          active: true,
          prices: [{ locationId: 'l1', amount: 900, active: true }],
        },
      ],
    });
    render(<ServicesPage />);
    expect(await screen.findByRole('heading', { name: 'Послуги' })).toBeInTheDocument();
  });
});
