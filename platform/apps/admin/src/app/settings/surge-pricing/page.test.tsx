// Ціноутворення surge (T-4811): сторінка показує чинні правила, PUT надсилає
// тіло з множником у базисних пунктах, а невалідне значення блокує збереження.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurgePricingSettingsPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/settings/surge-pricing',
}));

const RULES = [
  {
    id: 'r1',
    locationId: 'loc-1',
    dayOfWeek: 4,
    fromMinute: 1080,
    toMinute: 1260,
    seniorityTier: 'senior',
    multiplierBp: 12_500,
    active: true,
  },
];
const LOCATIONS = [{ id: 'loc-1', name: 'Поділ' }];

const api = () =>
  jest.fn((url: string, init?: RequestInit) => {
    if (url === '/admin/locations')
      return Promise.resolve({ ok: true, json: async () => LOCATIONS });
    if (url !== '/admin/pricing/surge-rules') return Promise.resolve({ ok: false });
    if (init?.method === 'PUT') {
      return Promise.resolve({ ok: true, json: async () => JSON.parse(String(init.body)) });
    }
    return Promise.resolve({ ok: true, json: async () => RULES });
  });

describe('SurgePricingSettingsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('показує чинні правила з областю дії й множником', async () => {
    (global.fetch as jest.Mock).mockImplementation(api());
    render(<SurgePricingSettingsPage />);

    expect(await screen.findByText('Поділ · Пт · 18:00–21:00 · senior')).toBeInTheDocument();
    expect(screen.getByText('Множник ×1.25')).toBeInTheDocument();
    expect(screen.getByText('Активне')).toBeInTheDocument();
  });

  it('нове правило надсилає множник у базисних пунктах', async () => {
    (global.fetch as jest.Mock).mockImplementation(api());
    render(<SurgePricingSettingsPage />);

    await screen.findByText('Множник ×1.25');
    await userEvent.selectOptions(screen.getByLabelText('День тижня'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Додати правило' }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/pricing/surge-rules',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            locationId: null,
            dayOfWeek: 5,
            fromMinute: null,
            toMinute: null,
            seniorityTier: null,
            multiplierBp: 12_500,
          }),
        })
      )
    );
    expect(await screen.findByText(/Правило додано/)).toBeInTheDocument();
  });

  it('множник нижче 100% блокує збереження з поясненням', async () => {
    (global.fetch as jest.Mock).mockImplementation(api());
    render(<SurgePricingSettingsPage />);

    await screen.findByText('Множник ×1.25');
    const percent = screen.getByLabelText('Множник, %');
    await userEvent.clear(percent);
    await userEvent.type(percent, '90');

    expect(screen.getByRole('alert')).toHaveTextContent(/100–500%/);
    expect(screen.getByRole('button', { name: 'Додати правило' })).toBeDisabled();
  });

  it('порожній список каже, що ціна базова', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      jest.fn((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () => (url === '/admin/locations' ? LOCATIONS : []),
        })
      )
    );
    render(<SurgePricingSettingsPage />);

    expect(await screen.findByText(/усі слоти йдуть за базовою ціною/)).toBeInTheDocument();
  });

  it('помилка завантаження показує банер із повторною спробою', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<SurgePricingSettingsPage />);

    expect(await screen.findByText('Не вдалося завантажити правила.')).toBeInTheDocument();
  });
});
