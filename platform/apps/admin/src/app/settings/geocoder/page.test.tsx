import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import GeocoderSettingsPage from './page';

// Налаштування геокодування (MNG-ADM-18): сторінка фетчить GET
// /admin/settings/geocoder напряму (сесію перевіряє AdminShell у layout),
// збереження — PUT. Черга моків — тільки виклики geocoder API.

const mockPush = jest.fn();
// Стабільний об'єкт роутера: ефект завантаження залежить від [router],
// новий об'єкт на кожен рендер перезапускав би GET і з'їдав чергу моків.
const mockRouter = { push: mockPush };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/settings/geocoder',
}));

const settingsResponse = {
  provider: 'nominatim',
  rateLimit: { max: 1, windowMs: 1000 },
  cacheTtlMs: 86_400_000,
  googleConfigured: false,
};

describe('GeocoderSettingsPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders current provider and limits', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => settingsResponse,
    });

    render(<GeocoderSettingsPage />);
    expect(await screen.findByText('Nominatim (OpenStreetMap)')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Nominatim/i })).toBeChecked();
    expect(
      screen.getByText(/Зовнішні запити: до 1 за 1 с · кеш відповідей: 24 год\./)
    ).toBeInTheDocument();
  });

  it('switching provider sends PUT and shows confirmation', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => settingsResponse })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...settingsResponse, provider: 'google', googleConfigured: true }),
      });

    render(<GeocoderSettingsPage />);
    const googleRadio = await screen.findByRole('radio', { name: /Google Geocoding/i });
    fireEvent.click(googleRadio);

    await waitFor(() => {
      const put = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PUT');
      expect(put).toBeTruthy();
    });
    const notice = await screen.findByRole('status');
    await waitFor(() => expect(notice).toHaveTextContent(/Збережено — застосовується негайно/));
    const put = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PUT');
    if (!put) throw new Error('PUT /admin/settings/geocoder не викликано');
    expect(put[0]).toBe('/admin/settings/geocoder');
    expect(JSON.parse(put[1].body)).toEqual({ provider: 'google' });
    expect(screen.getByRole('radio', { name: /Google Geocoding/i })).toBeChecked();
  });

  it('google option is disabled while API key is not configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => settingsResponse,
    });

    render(<GeocoderSettingsPage />);
    const googleRadio = await screen.findByRole('radio', { name: /Google Geocoding/i });
    expect(googleRadio).toBeDisabled();
    expect(screen.getByText(/ключ не задано в API/i)).toBeInTheDocument();
  });

  it('shows retry block when settings fail to load', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    render(<GeocoderSettingsPage />);
    expect(await screen.findByText('Не вдалося завантажити налаштування.')).toBeInTheDocument();
  });
});
