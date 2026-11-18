// Тести довідників і створення візиту (T-4409 UI / T-046).
import { screen, waitFor, fireEvent } from '@testing-library/react';
import {
  REFS,
  SERVICES,
  mockRoutesHandler,
  mockOtpRoutes,
  mockFullStack,
  passOtp,
  refsLoaded,
  chooseDate,
  chooseBarber,
} from './phone-test-helpers';

describe('PhoneBookingPage — візит і довідники', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('довідники: лише активні, барбер без імені — за телефоном', async () => {
    mockFullStack({ 'otp-request': { status: 201 }, 'otp-verify': { status: 201 } });
    await passOtp({}, { skipMock: true });
    await refsLoaded();
    expect(screen.getByRole('option', { name: '+380671110002' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Стара Філія' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Петро' })).not.toBeInTheDocument();
  });

  it('помилка завантаження довідників → alert з повтором, форми заблоковані', async () => {
    mockOtpRoutes({
      'otp-request': { status: 201 },
      'otp-verify': { status: 201 },
      locations: { status: 500 },
      barbers: { status: 500 },
    });
    await passOtp({}, { skipMock: true });
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Не вдалося завантажити довідники')
    );
    expect(screen.getByLabelText('Локація')).toBeDisabled();
    expect(screen.getByLabelText('Барбер')).toBeDisabled();
    expect(screen.getByText('Створити візит')).toBeDisabled();
    mockFullStack({});
    fireEvent.click(screen.getByText('Спробувати ще раз'));
    await refsLoaded();
    expect(screen.getByLabelText('Локація')).toBeEnabled();
    // Кнопка лишається вимкненою, доки не обрано послугу (T-4738).
    expect(screen.getByText('Створити візит')).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('порожній вибір локації/барбера не відправляється (гвард)', async () => {
    let bookingCalls = 0;
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.endsWith('/admin/bookings')) {
        bookingCalls += 1;
        return { ok: true, status: 201, json: async () => ({}) };
      }
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
    await chooseDate();
    await chooseBarber('barber-1');
    const form = screen.getByLabelText('Створення візиту').closest('form');
    if (!form) throw new Error('форма створення візиту не знайдена');
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByText('Оберіть локацію, послугу, барбера і час')).toBeInTheDocument()
    );
    expect(bookingCalls).toBe(0);
  });
});
