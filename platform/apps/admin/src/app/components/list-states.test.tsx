import { fireEvent, render, screen } from '@testing-library/react';
import LocationsPage from '../locations/page';
import ServicesPage from '../services/page';

// T-4516: стани списків адмінки перевіряються через справжні екрани й fetch,
// а не через окремий рендер компонента станів.
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const LOCATIONS = [
  { id: 'loc-1', code: 'KYY-01', name: 'FADE Сіті Лейк', address: 'пров. Ювілейний 2/1' },
];

const SERVICES = [
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
];

const ok = (body: unknown) => Promise.resolve({ ok: true, json: async () => body });

describe('admin list states (T-4516)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('locations: skeleton, not a spinner, while the list is loading', async () => {
    let resolve: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );

    render(<LocationsPage />);
    expect(screen.getByTestId('list-skeleton')).toBeInTheDocument();

    resolve({ ok: true, json: async () => LOCATIONS });
    expect(await screen.findByText('FADE Сіті Лейк')).toBeInTheDocument();
    expect(screen.queryByTestId('list-skeleton')).not.toBeInTheDocument();
  });

  it('locations: the error banner retries the same request and clears itself', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => LOCATIONS });

    render(<LocationsPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити локації');

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    expect(await screen.findByText('FADE Сіті Лейк')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(2);
  });

  it('services: an empty catalog is an empty state, not an empty table', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => ok([]));

    render(<ServicesPage />);
    expect(await screen.findByText('Каталог порожній')).toBeInTheDocument();
  });

  it('services: a failed load shows the retry that reloads the catalog', async () => {
    let failed = false;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (!failed) {
        failed = true;
        return Promise.resolve({ ok: false });
      }
      return ok(url === '/admin/services' ? SERVICES : []);
    });

    render(<ServicesPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити каталог');

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));
    // Назва в рядку — значення input (збереження по blur), не текст.
    expect(await screen.findByDisplayValue('Батько + син')).toBeInTheDocument();
  });
});
