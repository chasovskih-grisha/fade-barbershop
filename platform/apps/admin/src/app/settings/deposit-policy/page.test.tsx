// Політика депозиту (PAY-ADM-09): сторінка показує чинні значення, PUT
// надсилає всі три поля, а невалідне значення блокує збереження.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DepositPolicySettingsPage from './page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/settings/deposit-policy',
}));

const POLICY = { percent: 30, rounding: 10, cancellationWindowHours: 4, version: 1 };
const HISTORY = [{ ...POLICY, createdAt: '2026-12-07T10:00:00.000Z', createdBy: null }];

const api = (saved = POLICY) =>
  jest.fn((url: string, init?: RequestInit) => {
    if (url.endsWith('/admin/settings/deposit-policy/history')) {
      return Promise.resolve({ ok: true, json: async () => HISTORY });
    }
    if (!url.endsWith('/admin/settings/deposit-policy')) return Promise.resolve({ ok: false });
    if (init?.method === 'PUT') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ ...JSON.parse(String(init.body)), version: saved.version + 1 }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => saved });
  });

describe('DepositPolicySettingsPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('показує чинні відсоток, округлення і вікно', async () => {
    (global.fetch as jest.Mock).mockImplementation(api());
    render(<DepositPolicySettingsPage />);

    const percent = await screen.findByLabelText(/Відсоток від ціни візиту/);
    expect((percent as HTMLInputElement).value).toBe('30');
    expect((screen.getByLabelText('Округлення суми депозиту') as HTMLSelectElement).value).toBe(
      '10'
    );
    expect(
      (screen.getByLabelText('Вікно безкоштовного скасування, годин') as HTMLInputElement).value
    ).toBe('4');
    expect(screen.getByText(/^Версія 1 ·/)).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Історія версій' })).toHaveTextContent(
      'Версія 1'
    );
  });

  it('збереження надсилає всю політику і показує тост', async () => {
    (global.fetch as jest.Mock).mockImplementation(api());
    render(<DepositPolicySettingsPage />);

    const percent = await screen.findByLabelText(/Відсоток від ціни візиту/);
    await userEvent.clear(percent);
    await userEvent.type(percent, '50');
    await userEvent.selectOptions(screen.getByLabelText('Округлення суми депозиту'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/settings/deposit-policy',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ percent: 50, rounding: 5, cancellationWindowHours: 4 }),
        })
      )
    );
    expect(await screen.findByText(/Політику збережено/)).toBeInTheDocument();
  });

  it('відсоток поза 0–100 блокує збереження з поясненням', async () => {
    (global.fetch as jest.Mock).mockImplementation(api());
    render(<DepositPolicySettingsPage />);

    const percent = await screen.findByLabelText(/Відсоток від ціни візиту/);
    await userEvent.clear(percent);
    await userEvent.type(percent, '150');

    expect(screen.getByRole('alert')).toHaveTextContent(/ціле число 0–100/);
    expect(screen.getByRole('button', { name: 'Зберегти' })).toBeDisabled();
  });

  it('помилка завантаження показує банер із повторною спробою', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<DepositPolicySettingsPage />);

    expect(await screen.findByText('Не вдалося завантажити налаштування.')).toBeInTheDocument();
  });
});
