// «Пристрої» (T-4422): список сесій, підтвердження «вийти скрізь» і стани.
// Мокаємо API-клієнт і useAuth — сторінка не має ходити в мережу в тесті.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getClientSessions, revokeAllSessions } from '@/lib/api/client-sessions';
import { useAuth } from '../../components/auth/AuthProvider';
import DevicesPage from './page';

jest.mock('@/lib/api/client-sessions', () => ({
  getClientSessions: jest.fn(),
  revokeAllSessions: jest.fn(),
}));
jest.mock('../../components/auth/AuthProvider', () => ({ useAuth: jest.fn() }));

const getSessions = getClientSessions as jest.MockedFunction<typeof getClientSessions>;
const revokeAll = revokeAllSessions as jest.MockedFunction<typeof revokeAllSessions>;

const session = (id: string, channel: 'web' | 'mobile', current: boolean) => ({
  id,
  channel,
  createdAt: '2026-10-07T09:00:00.000Z',
  current,
});

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({ isLoading: false } as never);
});

describe('«Пристрої» (T-4422)', () => {
  it('показує канали і позначку поточного пристрою', async () => {
    getSessions.mockResolvedValue([
      session('s-web', 'web', true),
      session('s-mob', 'mobile', false),
    ]);
    render(<DevicesPage />);

    expect(await screen.findByText('Вебсайт')).toBeInTheDocument();
    expect(screen.getByText('Мобільний застосунок')).toBeInTheDocument();
    expect(screen.getByText('Цей пристрій')).toBeInTheDocument();
  });

  it('«вийти скрізь» після підтвердження викликає ревок і перезавантажує список', async () => {
    getSessions.mockResolvedValue([
      session('s-web', 'web', true),
      session('s-mob', 'mobile', false),
    ]);
    revokeAll.mockResolvedValue(1);
    render(<DevicesPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Вийти з усіх інших пристроїв' }));
    fireEvent.click(screen.getByRole('button', { name: 'Вийти скрізь' }));

    await waitFor(() => expect(revokeAll).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getSessions).toHaveBeenCalledTimes(2));
  });

  it('кнопка заблокована, коли інших пристроїв немає', async () => {
    getSessions.mockResolvedValue([session('s-web', 'web', true)]);
    render(<DevicesPage />);

    expect(
      await screen.findByRole('button', { name: 'Вийти з усіх інших пристроїв' })
    ).toBeDisabled();
  });

  it('помилка завантаження — банер із повторною спробою', async () => {
    getSessions.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([]);
    render(<DevicesPage />);

    expect(
      await screen.findByText('Не вдалося завантажити пристрої. Спробуйте пізніше.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Спробувати ще раз' }));

    expect(await screen.findByText('Немає активних пристроїв')).toBeInTheDocument();
  });
});
