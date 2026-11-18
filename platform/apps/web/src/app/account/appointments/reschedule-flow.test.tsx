// T-4533 (Done 2): після підтвердженого переносу кабінет перечитує список і
// показує новий час; перенос не є скасуванням — аналітика фіксує rescheduled,
// а не cancelled. Мок лише на межі API/аналітики — реальні хуки й компоненти.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAppointments, rescheduleAppointment } from '@/lib/api/appointments';
import { clientCabinetAnalytics } from '@/lib/analytics';
import { useAuth } from '../../components/auth/AuthProvider';
import { getReferencePhotoUrl } from '../../booking/referencePhotoApi';
import AppointmentsPage from './page';
import { makeVisit } from './test-fixtures';

jest.mock('@/lib/api/appointments', () => ({
  ...jest.requireActual('@/lib/api/appointments'),
  getAppointments: jest.fn(),
  rescheduleAppointment: jest.fn(),
}));
jest.mock('../../booking/referencePhotoApi', () => ({ getReferencePhotoUrl: jest.fn() }));
jest.mock('../../components/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock('@/lib/analytics', () => ({
  ...jest.requireActual('@/lib/analytics'),
  clientCabinetAnalytics: { appointmentRescheduled: jest.fn(), appointmentCancelled: jest.fn() },
}));

const listMock = getAppointments as jest.MockedFunction<typeof getAppointments>;
const moveMock = rescheduleAppointment as jest.MockedFunction<typeof rescheduleAppointment>;
const analytics = clientCabinetAnalytics as jest.Mocked<typeof clientCabinetAnalytics>;

beforeEach(() => {
  listMock.mockReset();
  moveMock.mockReset();
  analytics.appointmentRescheduled.mockReset();
  analytics.appointmentCancelled.mockReset();
  jest.mocked(getReferencePhotoUrl).mockReset();
  jest.mocked(getReferencePhotoUrl).mockResolvedValue(null);
  (useAuth as jest.MockedFunction<typeof useAuth>).mockReturnValue({
    isLoading: false,
    refreshUser: jest.fn(),
  } as never);
});

describe('перенесення у кабінеті (T-4533)', () => {
  it('після підтвердження показує новий час і фіксує rescheduled, не cancelled', async () => {
    listMock
      .mockResolvedValueOnce([makeVisit({ id: 'apt-1', date: '2026-10-02', startTime: '11:00' })])
      .mockResolvedValueOnce([makeVisit({ id: 'apt-1', date: '2026-10-03', startTime: '14:00' })]);
    moveMock.mockResolvedValue(undefined);

    render(<AppointmentsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Перенести' }));
    fireEvent.change(screen.getByLabelText('Дата'), { target: { value: '2026-10-03' } });
    fireEvent.change(screen.getByLabelText('Початок'), { target: { value: '14:00' } });
    // Кнопка картки й кнопка підтвердження діалогу мають ту саму назву —
    // підтверджуємо саме діалог (остання в DOM).
    const submit = screen.getAllByRole('button', { name: 'Перенести' }).at(-1);
    if (!submit) throw new Error('кнопка підтвердження переносу не знайдена');
    fireEvent.click(submit);

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('2026-10-03 о 14:00')).toBeInTheDocument();
    expect(screen.queryByText('2026-10-02 о 11:00')).toBeNull();
    expect(analytics.appointmentRescheduled).toHaveBeenCalledWith('apt-1');
    expect(analytics.appointmentCancelled).not.toHaveBeenCalled();
  });
});
