// Стани екрана «Моїх візитів»: помилка, порожній кабінет. Окремо від
// cabinet.test.tsx через LOC-гейт (ADR 0019).
// Регресія: getAppointments перетворював 404 на [], тож відсутній маршрут
// виглядав як «у вас немає візитів» — без жодної помилки на екрані.
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAppointments } from '@/lib/api/appointments';
import { useAuth } from '../../components/auth/AuthProvider';
import { getReferencePhotoUrl } from '../../booking/referencePhotoApi';
import AppointmentsPage from './page';

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

describe('«Мої візити» — стани екрана', () => {
  it('порожній кабінет: два EmptyState з CTA на запис, без банера помилки', async () => {
    getAppointmentsMock.mockResolvedValue([]);
    render(<AppointmentsPage />);
    expect(await screen.findByText('У вас немає майбутніх записів')).toBeInTheDocument();
    expect(screen.getByText('Історія порожня')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Записатися' }).getAttribute('href')).toBe('/booking');
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('помилка завантаження показується, а не маскується порожнім списком', async () => {
    getAppointmentsMock.mockRejectedValue(new Error('boom'));
    render(<AppointmentsPage />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Не вдалося завантажити візити');
    expect(screen.queryByText('Історія порожня')).toBeNull();
  });
});
