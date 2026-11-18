// Фільтр по статусах і сортування за датою у «Моїх візитах» кабінету.
// Окремий файл від cabinet.test.tsx за LOC-гейтом (ADR 0019).
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAppointments } from '@/lib/api/appointments';
import { useAuth } from '../../components/auth/AuthProvider';
import { getReferencePhotoUrl } from '../../booking/referencePhotoApi';
import AppointmentsPage from './page';
import { makeVisit } from './test-fixtures';

jest.mock('@/lib/api/appointments', () => ({
  ...jest.requireActual('@/lib/api/appointments'),
  getAppointments: jest.fn(),
}));
jest.mock('../../booking/referencePhotoApi', () => ({ getReferencePhotoUrl: jest.fn() }));
jest.mock('../../components/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const getAppointmentsMock = getAppointments as jest.MockedFunction<typeof getAppointments>;

beforeEach(() => {
  getAppointmentsMock.mockReset();
  jest.mocked(getReferencePhotoUrl).mockReset();
  jest.mocked(getReferencePhotoUrl).mockResolvedValue(null);
  (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
    isLoading: false,
    refreshUser: jest.fn(),
  } as never);
});

describe('«Мої візити» — фільтр по статусах', () => {
  it('фільтр «Завершено» показує лише completed, лічильник оновлюється', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'a', serviceName: 'Стрижка a', status: 'upcoming' }),
      makeVisit({ id: 'b', serviceName: 'Стрижка b', status: 'completed' }),
      makeVisit({ id: 'c', serviceName: 'Стрижка c', status: 'cancelled' }),
    ]);
    render(<AppointmentsPage />);
    await screen.findByLabelText('Статус');

    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'completed' } });
    // Картка рендерить «Назва • Барбер» — мачимо початком рядка.
    expect(screen.getByText(/^Стрижка b/)).toBeInTheDocument();
    expect(screen.queryByText(/^Стрижка a/)).toBeNull();
    expect(screen.queryByText(/^Стрижка c/)).toBeNull();
    expect(screen.getByText('Показано: 1')).toBeInTheDocument();
  });

  it('порожній результат фільтра — EmptyState «Нічого не знайдено», не хибні EmptyState секцій', async () => {
    getAppointmentsMock.mockResolvedValue([makeVisit({ id: 'a', status: 'upcoming' })]);
    render(<AppointmentsPage />);
    await screen.findByLabelText('Статус');

    fireEvent.change(screen.getByLabelText('Статус'), { target: { value: 'cancelled' } });
    expect(screen.getByText('Нічого не знайдено')).toBeInTheDocument();
    expect(screen.queryByText('Історія порожня')).toBeNull();
  });
});

describe('«Мої візити» — сортування за датою', () => {
  it('дефолт новіші зверху; «Спочатку старіші» міняє порядок', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'old', date: '2026-10-01', serviceName: 'Стрижка old', status: 'upcoming' }),
      makeVisit({ id: 'new', date: '2026-10-05', serviceName: 'Стрижка new', status: 'upcoming' }),
    ]);
    render(<AppointmentsPage />);
    await screen.findByLabelText('Сортування');

    const titles = () =>
      screen
        .getAllByText(/^Стрижка (old|new)/)
        .map((node) => (String(node.textContent).startsWith('Стрижка new') ? 'new' : 'old'));
    expect(titles()).toEqual(['new', 'old']);

    fireEvent.change(screen.getByLabelText('Сортування'), { target: { value: 'asc' } });
    expect(titles()).toEqual(['old', 'new']);
  });
});
