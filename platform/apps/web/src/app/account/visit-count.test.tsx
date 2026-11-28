import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountProfileCard } from './AccountProfileCard';
import { getAppointments, type ExtendedAppointment } from '@/lib/api/appointments';
import AccountPage from './page';

jest.mock('@/lib/api/appointments', () => ({
  ...jest.requireActual('@/lib/api/appointments'),
  getAppointments: jest.fn(),
}));

const mockUser = { id: 'usr_1', name: 'Олександр', phone: '+380991234567', preferences: [] };

jest.mock('../components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}));

const getAppointmentsMock = getAppointments as jest.MockedFunction<typeof getAppointments>;

function visit(over: Partial<ExtendedAppointment> = {}): ExtendedAppointment {
  return {
    id: 'v1',
    date: '2026-11-01',
    startTime: '14:00',
    endTime: '15:00',
    serviceName: 'Стрижка',
    barberName: 'Олександр',
    locationName: 'Центр',
    price: 600,
    status: 'completed',
    referenceId: null,
    referenceComment: '',
    canEditReference: false,
    canBookAgain: true,
    deposit: null,
    ...over,
  };
}

function card(visitCount: number | null) {
  return (
    <AccountProfileCard
      name="Олександр"
      phone="+380991234567"
      visitCount={visitCount}
      device={{ channel: null, others: null }}
      saving={false}
      canSave={false}
      onNameChange={jest.fn()}
      onSave={jest.fn()}
      onChangePhone={jest.fn()}
    />
  );
}

describe('visit count on the website profile (T-4734b)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [], generations: [], remainingToday: 3 }),
    });
  });
  afterEach(() => jest.clearAllMocks());

  it('renders the count under the name and keeps zero visible', () => {
    const { unmount } = render(card(3));
    expect(screen.getByText('Візитів: 3')).toBeInTheDocument();
    unmount();
    render(card(0));
    expect(screen.getByText('Візитів: 0')).toBeInTheDocument();
  });

  it('hides the line when the visits load failed', () => {
    render(card(null));
    expect(screen.queryByText(/Візитів:/)).toBeNull();
  });

  it('counts the past visits the cabinet loads, without a second request', async () => {
    getAppointmentsMock.mockResolvedValue([
      visit({ id: 'p1' }),
      visit({ id: 'p2', status: 'cancelled' }),
      visit({ id: 'u1', status: 'confirmed', date: '2026-12-04' }),
    ]);
    render(<AccountPage />);
    await waitFor(() => expect(screen.getByText('Візитів: 2')).toBeInTheDocument());
    expect(getAppointmentsMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the profile without the line when the visits request fails', async () => {
    getAppointmentsMock.mockRejectedValue(new Error('boom'));
    render(<AccountPage />);
    await waitFor(() => expect(getAppointmentsMock).toHaveBeenCalled());
    expect(screen.queryByText(/Візитів:/)).toBeNull();
  });
});
