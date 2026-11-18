// Повний флоу бронювання та 409 (T-4409 UI / T-046).
import { screen, waitFor, fireEvent } from '@testing-library/react';
import {
  REFS,
  SERVICES,
  VERIFIED_CLIENT_ID,
  mockFullStack,
  passOtp,
  refsLoaded,
  chooseLocation,
  chooseService,
  chooseDate,
  chooseBarber,
  pickSlotByTime,
} from './phone-test-helpers';

/** OTP → довідники → локація/послуга/дата/барбер/слот 10:00 → «Створити візит». */
async function bookFirstSlot(): Promise<void> {
  await passOtp({}, { skipMock: true });
  await refsLoaded();
  await chooseLocation();
  await chooseService();
  await chooseDate();
  await chooseBarber('barber-1');
  await pickSlotByTime('10:00');
  fireEvent.click(screen.getByText('Створити візит'));
}

describe('PhoneBookingPage — створення візиту', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('повний флоу: OTP → довідники → слот → payload з origin admin (T-046) → 201', async () => {
    let bookingBody = '';
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: { method?: string; body?: string }) => {
      if (url.endsWith('/admin/clients/otp/request')) return { ok: true, status: 201, json: async () => ({}) };
      if (url.endsWith('/admin/clients/otp/verify')) return { ok: true, status: 201, json: async () => ({ phoneVerifiedAt: '2026-10-02T10:00:00.000Z', clientId: VERIFIED_CLIENT_ID }) };
      if (url.endsWith('/admin/bookings')) {
        bookingBody = String(init?.body);
        return { ok: true, status: 201, json: async () => ({}) };
      }
      if (url.endsWith('/admin/locations')) return { ok: true, status: 200, json: async () => REFS.locations };
      if (url.endsWith('/admin/barbers')) return { ok: true, status: 200, json: async () => REFS.barbers };
      if (url.endsWith('/admin/services')) return { ok: true, status: 200, json: async () => SERVICES };
      if (url.endsWith('/admin/bookings/slots')) return { ok: true, status: 200, json: async () => [{ start: '10:00', end: '10:30', barbers: ['barber-1'] }] };
      throw new Error('unexpected fetch: ' + url);
    });

    await bookFirstSlot();
    await waitFor(() => {
      expect(bookingBody).toContain('"source":"admin"');
      // Тривалість — це тривалість обраної послуги (svc-1 = 45), не 30 (T-4738).
      expect(bookingBody).toContain('"serviceDuration":45');
      expect(bookingBody).toContain('"serviceId":"svc-1"');
      expect(bookingBody).toContain('"barberId":"barber-1"');
      expect(bookingBody).toContain('"start":"10:00"');
      expect(bookingBody).toContain('"end":"10:30"');
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Візит створено.');
  });

  it('origin.clientId = верифікований клієнт, а не null (T-046)', async () => {
    let bookingBody = '';
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: { body?: string }) => {
      if (url.endsWith('/admin/clients/otp/verify')) return { ok: true, status: 201, json: async () => ({ phoneVerifiedAt: '2026-10-02T10:00:00.000Z', clientId: VERIFIED_CLIENT_ID }) };
      if (url.endsWith('/admin/bookings')) {
        bookingBody = String(init?.body);
        return { ok: true, status: 201, json: async () => ({}) };
      }
      if (url.endsWith('/admin/locations')) return { ok: true, status: 200, json: async () => REFS.locations };
      if (url.endsWith('/admin/barbers')) return { ok: true, status: 200, json: async () => REFS.barbers };
      if (url.endsWith('/admin/services')) return { ok: true, status: 200, json: async () => SERVICES };
      if (url.endsWith('/admin/bookings/slots')) return { ok: true, status: 200, json: async () => [{ start: '10:00', end: '10:30', barbers: ['barber-1'] }] };
      throw new Error('unexpected fetch: ' + url);
    });

    await bookFirstSlot();
    await waitFor(() => expect(bookingBody).toContain(`"clientId":"${VERIFIED_CLIENT_ID}"`));
    // null — це той самий баг, що й до зміни: привʼязки до клієнта немає.
    expect(bookingBody).not.toContain('"clientId":null');
  });

  it('409 на бронювання → «Слот зайнятий» (role=alert)', async () => {
    mockFullStack({
      'otp-request': { status: 201 },
      'otp-verify': { status: 201 },
      booking: { status: 409 },
    });
    await passOtp({}, { skipMock: true });
    await refsLoaded();
    await chooseLocation();
    await chooseService();
    await chooseDate();
    await chooseBarber('barber-1');
    await pickSlotByTime('10:00');
    const form = screen.getByLabelText('Створення візиту').closest('form');
    if (!form) throw new Error('форма створення візиту не знайдена');
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Слот зайнятий — оберіть інший час')
    );
  });
});
