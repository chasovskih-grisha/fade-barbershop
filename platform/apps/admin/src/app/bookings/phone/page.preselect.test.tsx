// «Записати» з картки клієнта CRM → телефонний запис із передобраним клієнтом
// (T-046): ?clientId=&phone= минає OTP-крок і одразу відкриває форму візиту з
// карткою верифікованого клієнта; payload лишається origin.clientId (T-046).
// OTP-гілки preselect (лише ?phone=) — у page.preselect-otp.test.tsx.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PhoneBookingPage from './page';
import { mockRoutesHandler, REFS, SERVICES, refsLoaded, chooseService } from './phone-test-helpers';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(globalThis.location.search),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/bookings/phone',
}));

const CLIENT = {
  id: 'user-1',
  name: 'Олена Клієнт',
  phone: '+380501112233',
  vipDiscountPercent: 10,
  loyaltyVisitsCount: 3,
};

const BOOKING_SLOTS = [{ start: '10:00', end: '10:30', barbers: ['barber-1'] }];

function mockAllHappyRoutes(onBooking?: (body: string) => void): void {
  // prettier-ignore
  (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: { body?: string }) => {
    if (url.endsWith('/admin/clients/by-user/user-1')) {
      return { ok: true, status: 200, json: async () => CLIENT };
    }
    if (url.endsWith('/admin/bookings')) {
      onBooking?.(String(init?.body));
      return { ok: true, status: 201, json: async () => ({}) };
    }
    return mockRoutesHandler(url, {
      locations: { status: 200, body: REFS.locations },
      barbers: { status: 200, body: REFS.barbers },
      services: { status: 200, body: SERVICES },
      slots: { status: 200, body: BOOKING_SLOTS },
    });
  });
}

/** Перша дата з фактичного списку опцій (робочий день, реально існуюча). */
async function firstDateOption(): Promise<string> {
  const select = (await screen.findByRole('combobox', { name: 'Дата' })) as HTMLSelectElement;
  const option = [...select.options].find((o) => o.value !== '');
  if (!option) throw new Error('Дата: немає жодної доступної опції');
  return option.value;
}

async function pickFirstFreeSlot(): Promise<void> {
  const slot = await waitFor(() => {
    const found = screen
      .getAllByRole('button')
      .find((b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').includes('10:00'));
    if (!found) throw new Error('слот 10:00 ще не завантажено');
    return found;
  });
  fireEvent.click(slot);
  await waitFor(() =>
    expect(document.querySelector<HTMLInputElement>('[name="selectedStart"]')?.value).toBe('10:00')
  );
}

describe('PhoneBookingPage — «Записати» з CRM: форма візиту (preselect T-046)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    window.history.replaceState({}, '', '/bookings/phone?clientId=user-1&phone=%2B380501112233');
  });
  afterEach(() => {
    window.history.replaceState({}, '', '/bookings/phone');
    jest.restoreAllMocks();
  });

  it('?clientId+phone → форма візиту одразу, OTP-крок пропущено', async () => {
    mockAllHappyRoutes();
    render(<PhoneBookingPage />);
    // Форма вже тут — ані «Надіслати код», ані «Підтвердити» не потрібно.
    await refsLoaded();
    expect(screen.queryByLabelText('Номер клієнта')).toBeNull();
    // Телефон — у картці клієнта впереміш з іншим текстом: перевіряємо textContent.
    const card = screen.getByLabelText('Верифікований клієнт');
    expect(card.textContent).toContain('+380501112233');
    expect(card.textContent).toContain('Олена Клієнт');
  });

  it('payload містить origin.clientId із запиту CRM (T-046)', async () => {
    let bookingBody = '';
    mockAllHappyRoutes((body) => (bookingBody = body));
    render(<PhoneBookingPage />);
    await refsLoaded();
    fireEvent.change(screen.getByRole('combobox', { name: 'Локація' }), {
      target: { value: 'loc-1' },
    });
    await chooseService();
    fireEvent.change(await screen.findByRole('combobox', { name: 'Дата' }), {
      target: { value: await firstDateOption() },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Барбер' }), {
      target: { value: 'barber-1' },
    });
    await pickFirstFreeSlot();
    fireEvent.click(screen.getByText('Створити візит'));
    await waitFor(() => expect(bookingBody).toContain('"clientId":"user-1"'));
    expect(bookingBody).toContain('"source":"admin"');
    expect(await screen.findByRole('status')).toHaveTextContent('Візит створено.');
  });
});
