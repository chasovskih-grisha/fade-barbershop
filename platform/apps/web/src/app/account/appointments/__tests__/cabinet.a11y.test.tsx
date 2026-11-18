import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAppointments } from '@/lib/api/appointments';
import { useAuth } from '../../../components/auth/AuthProvider';
import AppointmentsPage from '../page';
import { makeVisit } from '../test-fixtures';

jest.mock('@/lib/api/appointments', () => ({
  ...jest.requireActual('@/lib/api/appointments'),
  getAppointments: jest.fn(),
}));
jest.mock('../../../booking/referencePhotoApi', () => ({ getReferencePhotoUrl: jest.fn().mockResolvedValue(null) }));
jest.mock('../../../components/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const getAppointmentsMock = getAppointments as jest.MockedFunction<typeof getAppointments>;

beforeEach(() => {
  getAppointmentsMock.mockReset();
  (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
    isLoading: false,
    refreshUser: jest.fn(),
  } as never);
});

describe('Appointments Cabinet Accessibility & WCAG Compliance', () => {
  it('announces loading state and loaded visits count via aria-live status region', async () => {
    getAppointmentsMock.mockResolvedValue([
      makeVisit({ id: 'a', status: 'upcoming' }),
      makeVisit({ id: 'b', status: 'completed' }),
    ]);

    render(<AppointmentsPage />);

    // Initially loading announcement
    expect(screen.getByRole('status')).toHaveTextContent(/Завантаження візитів/i);

    // After loading resolves
    await screen.findByRole('heading', { name: 'Мої візити' });
    expect(screen.getByRole('status')).toHaveTextContent(/Завантажено візитів: 2/i);
  });

  it('announces loading errors to screen readers', async () => {
    getAppointmentsMock.mockRejectedValue(new Error('Network error'));

    render(<AppointmentsPage />);

    expect(await screen.findByRole('status')).toHaveTextContent(/Помилка завантаження/i);
  });
});
