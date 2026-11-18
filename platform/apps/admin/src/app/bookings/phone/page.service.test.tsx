// T-4738b: послуга у формі телефонного запису — список за локацією, слоти
// міряються тривалістю послуги, а не фіксованими 30 хв.
import { screen, waitFor, fireEvent } from '@testing-library/react';
import {
  REFS,
  SERVICES,
  mockRoutesHandler,
  passOtp,
  refsLoaded,
  chooseLocation,
  chooseService,
  chooseDate,
  chooseBarber,
  pickSlotByTime,
} from './phone-test-helpers';

/** fetch з OTP-гілками + каталогом послуг; решта — типові маршрути. */
function mockWithServices(onSlots?: (body: string) => void, slots: object[] = []): void {
  const routes = {
    'otp-request': { status: 201 },
    'otp-verify': { status: 201 },
    locations: { status: 200, body: REFS.locations },
    barbers: { status: 200, body: REFS.barbers },
    services: { status: 200, body: SERVICES },
    slots: { status: 200, body: slots },
  };
  // prettier-ignore
  (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: { body?: string }) => {
    if (url.endsWith('/admin/bookings/slots')) onSlots?.(String(init?.body));
    return mockRoutesHandler(url, routes);
  });
}

describe('PhoneBookingPage — послуга візиту (T-4738b)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('послуга заблокована без локації; список — каталог обраної локації', async () => {
    const requested: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      requested.push(url);
      return mockRoutesHandler(url, {
        'otp-request': { status: 201 },
        'otp-verify': { status: 201 },
        locations: { status: 200, body: REFS.locations },
        barbers: { status: 200, body: REFS.barbers },
        services: { status: 200, body: SERVICES },
        slots: { status: 200, body: [] },
      });
    });

    await passOtp({}, { skipMock: true });
    await refsLoaded();
    // Доти, доки локації немає, послуга недоступна і каталог не питається.
    expect(screen.getByRole('combobox', { name: 'Послуга' })).toBeDisabled();
    expect(requested.some((url) => url.endsWith('/admin/services'))).toBe(false);

    await chooseLocation('loc-1');
    // Лише послуга з ціною в loc-1; «Борода» (loc-2) і неактивна «Фарба» — ні.
    expect(screen.getByRole('option', { name: 'Стрижка' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Борода' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Фарба' })).not.toBeInTheDocument();
  });

  it('без послуги кнопка «Створити візит» вимкнена, з послугою — увімкнена', async () => {
    mockWithServices();
    await passOtp({}, { skipMock: true });
    await refsLoaded();
    expect(screen.getByText('Створити візит')).toBeDisabled();
    await chooseLocation('loc-1');
    expect(screen.getByText('Створити візит')).toBeDisabled();
    await chooseService();
    expect(screen.getByText('Створити візит')).toBeEnabled();
  });

  it('зміна локації скидає обрану послугу', async () => {
    mockWithServices();
    await passOtp({}, { skipMock: true });
    await refsLoaded();
    await chooseLocation('loc-1');
    await chooseService();
    expect(screen.getByRole('combobox', { name: 'Послуга' })).toHaveValue('svc-1');

    fireEvent.change(screen.getByRole('combobox', { name: 'Локація' }), {
      target: { value: 'loc-2' },
    });
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Послуга' })).toHaveValue(''));
  });

  it('тривалість послуги міряє слоти (10:00–10:45), не фіксовані 30 хв', async () => {
    let slotsBody = '';
    mockWithServices(
      (body) => (slotsBody = body),
      [{ start: '10:00', end: '10:45', barbers: ['barber-1'] }]
    );

    await passOtp({}, { skipMock: true });
    await refsLoaded();
    await chooseLocation('loc-1');
    await chooseService();
    await chooseDate();
    await chooseBarber('barber-1');
    await pickSlotByTime('10:00');

    await waitFor(() => expect(slotsBody).toContain('"serviceId":"svc-1"'));
  });
});
