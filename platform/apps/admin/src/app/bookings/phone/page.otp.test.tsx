// Тести OTP-помилок екрана телефонного запису (T-4409 UI / T-046).
/* eslint-disable max-lines */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PhoneBookingPage from './page';
import { mockOtpRoutes, VERIFIED_CLIENT_ID } from './phone-test-helpers';

describe('PhoneBookingPage — OTP помилки', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('помилка верифікації показується людиною мовою (OTP_INVALID)', async () => {
    mockOtpRoutes({
      'otp-request': { status: 201, body: {} },
      'otp-verify': { status: 400, body: { code: 'OTP_INVALID' } },
    });
    render(<PhoneBookingPage />);
    fireEvent.change(screen.getByLabelText('Номер клієнта'), {
      target: { value: '+380501112233' },
    });
    fireEvent.click(screen.getByText('Надіслати код'));
    await waitFor(() =>
      expect(screen.getByLabelText('Код з SMS (клієнт диктує)')).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText('Код з SMS (клієнт диктує)'), {
      target: { value: '000000' },
    });
    fireEvent.click(screen.getByText('Підтвердити'));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Невірний код'));
  });

  it('201 без clientId → не йдемо до форми (не створюємо візит без клієнта)', async () => {
    // Порушення контракту verify: успіх, але клієнта немає. Краще зупинитись
    // із помилкою, ніж тихо створити запис з origin.clientId = null.
    // Мок саме тут, бо спільний хелпер підставляє типовий clientId на 201.
    let bookingCalls = 0;
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.endsWith('/admin/clients/otp/request')) return { ok: true, status: 201, json: async () => ({}) };
      if (url.endsWith('/admin/clients/otp/verify')) return { ok: true, status: 201, json: async () => ({ phoneVerifiedAt: '2026-10-02T10:00:00.000Z' }) };
      if (url.endsWith('/admin/bookings')) { bookingCalls += 1; return { ok: true, status: 201, json: async () => ({}) }; }
      if (url.endsWith('/admin/locations')) return { ok: true, status: 200, json: async () => [] };
      if (url.endsWith('/admin/barbers')) return { ok: true, status: 200, json: async () => [] };
      throw new Error('unexpected fetch: ' + url);
    });
    render(<PhoneBookingPage />);
    fireEvent.change(screen.getByLabelText('Номер клієнта'), {
      target: { value: '+380501112233' },
    });
    fireEvent.click(screen.getByText('Надіслати код'));
    // prettier-ignore
    await waitFor(() => expect(screen.getByLabelText('Код з SMS (клієнт диктує)')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Код з SMS (клієнт диктує)'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('Підтвердити'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Сервер не повернув клієнта')
    );
    // Форма візиту не рендериться — отже POST /admin/bookings не піде.
    expect(screen.queryByLabelText('Створення візиту')).toBeNull();
    expect(bookingCalls).toBe(0);
  });

  it('USER_NOT_FOUND → підказка про перший вхід', async () => {
    mockOtpRoutes({
      'otp-request': { status: 201, body: {} },
      'otp-verify': { status: 404, body: { code: 'USER_NOT_FOUND' } },
    });
    render(<PhoneBookingPage />);
    fireEvent.change(screen.getByLabelText('Номер клієнта'), {
      target: { value: '+380501112233' },
    });
    fireEvent.click(screen.getByText('Надіслати код'));
    await waitFor(() =>
      expect(screen.getByLabelText('Код з SMS (клієнт диктує)')).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText('Код з SMS (клієнт диктує)'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('Підтвердити'));
    // prettier-ignore
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Клієнта з таким номером ще не існує (потрібен перший вхід)'));
  });

  it('після успішного OTP показується новий вибір слоту, а не ручні поля', async () => {
    mockOtpRoutes({
      'otp-request': { status: 201, body: {} },
      'otp-verify': {
        status: 201,
        body: { phoneVerifiedAt: '2026-10-02T10:00:00.000Z', clientId: VERIFIED_CLIENT_ID },
      },
    });
    render(<PhoneBookingPage />);
    fireEvent.change(screen.getByLabelText('Номер клієнта'), {
      target: { value: '+380501112233' },
    });
    fireEvent.click(screen.getByText('Надіслати код'));
    await waitFor(() =>
      expect(screen.getByLabelText('Код з SMS (клієнт диктує)')).toBeInTheDocument()
    );
    fireEvent.change(screen.getByLabelText('Код з SMS (клієнт диктує)'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('Підтвердити'));
    await waitFor(() => expect(screen.getByLabelText('Барбер')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText('Дата')).toBeInTheDocument());
    expect(screen.queryByLabelText('Початок') || screen.queryByLabelText('Кінець')).toBeNull();
  });
});
/* eslint-enable max-lines */
