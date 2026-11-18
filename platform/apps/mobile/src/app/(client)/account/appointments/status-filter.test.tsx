// Фільтр по статусах у мобільному списку «Мої візити»: чипи фільтрують обидві
// секції, порожній результат за наявних візитів — «Нічого не знайдено».
// У рядку не рендериться id — мачимо по унікальних назвах послуг.
import { render, screen, fireEvent } from '@testing-library/react-native';
import { getAppointments } from '../../../../lib/api/appointments';
import type { ExtendedAppointment } from '../../../../lib/booking-contract';
import { makeVisit } from './fixtures';
import { MyVisitsScreen } from './page';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  router: { push: jest.fn() },
}));
jest.mock('../../../../lib/api/appointments', () => ({
  getAppointments: jest.fn(),
  setAppointmentReference: jest.fn(),
}));
jest.mock('../../../../lib/api/reference-photo', () => ({
  getReferencePhotoUrl: jest.fn(async () => null),
  uploadReferencePhoto: jest.fn(),
}));
jest.mock('../../../../lib/reference-picker', () => ({ pickReferencePhoto: jest.fn() }));

const mockedList = getAppointments as jest.MockedFunction<typeof getAppointments>;

// prettier-ignore
const visits: ExtendedAppointment[] = [
  makeVisit({ id: 'a', date: '2026-10-01', serviceName: 'Стрижка Old', status: 'upcoming' }),
  makeVisit({ id: 'b', date: '2026-10-05', serviceName: 'Стрижка New', status: 'upcoming' }),
  makeVisit({ id: 'c', date: '2026-09-01', serviceName: 'Гоління Confirmed', status: 'confirmed' }),
  makeVisit({ id: 'd', date: '2026-09-01', serviceName: 'Маска Completed', status: 'completed', canEditReference: false }),
  makeVisit({ id: 'e', date: '2026-09-02', serviceName: 'Депіляція Cancelled', status: 'cancelled', canEditReference: false }),
];

beforeEach(() => {
  mockedList.mockReset();
});

describe('«Мої візити» (mobile) — фільтр по статусах', () => {
  it('без фільтра видно всі п’ять візитів; чип «Завершено» лишає лише completed', async () => {
    mockedList.mockResolvedValue(visits);
    render(<MyVisitsScreen />);

    await screen.findByText('Стрижка New');
    expect(screen.getByText('Маска Completed')).toBeTruthy();
    expect(screen.getByText('Депіляція Cancelled')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Статус: Завершено'));

    expect(screen.queryByText('Стрижка New')).toBeNull();
    expect(screen.queryByText('Гоління Confirmed')).toBeNull();
    expect(screen.queryByText('Депіляція Cancelled')).toBeNull();
    expect(screen.getByText('Маска Completed')).toBeTruthy();
  });

  it('порожній результат фільтра — «Нічого не знайдено», не хибне «немає візитів»', async () => {
    mockedList.mockResolvedValue([makeVisit({ status: 'upcoming' })]);
    render(<MyVisitsScreen />);

    await screen.findByText('Стрижка');
    fireEvent.press(screen.getByLabelText('Статус: Скасовано'));

    expect(screen.getByText('Нічого не знайдено')).toBeTruthy();
    expect(screen.queryByText('У вас немає візитів')).toBeNull();
  });

  it('майбутні — спочатку новіші; чип «Усі» повертає повний список', async () => {
    mockedList.mockResolvedValue(visits);
    render(<MyVisitsScreen />);

    await screen.findByText('Стрижка New');
    // Секція «Майбутні»: new (05.10) перед old (01.10).
    const titles = screen.getAllByText(/20\d\d-\d\d-\d\d о \d\d:\d\d/);
    expect(titles[0].props.children[0]).toBe('2026-10-05');

    fireEvent.press(screen.getByLabelText('Статус: Скасовано'));
    expect(screen.getByText('Депіляція Cancelled')).toBeTruthy();
    expect(screen.queryByText('Стрижка New')).toBeNull();

    fireEvent.press(screen.getByLabelText('Статус: Усі'));
    expect(screen.getByText('Стрижка New')).toBeTruthy();
    expect(screen.getByText('Депіляція Cancelled')).toBeTruthy();
  });
});
