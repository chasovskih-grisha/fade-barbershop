// Спільні хелпери тестів телефонного запису (T-4409 UI / T-046).
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PhoneBookingPage from './page';

export {
  VERIFIED_CLIENT_ID,
  REFS,
  SLOTS,
  SERVICES,
  mockRoutesHandler,
  mockOtpRoutes,
  mockFullStack,
} from './phone-route-mocks';

import { mockOtpRoutes } from './phone-route-mocks';

export async function passOtp(
  routes: Record<string, { status: number; body?: object }> = {},
  opts: { skipMock?: boolean } = {}
) {
  if (!opts.skipMock) mockOtpRoutes(routes);
  render(<PhoneBookingPage />);
  fireEvent.change(screen.getByLabelText('Номер клієнта'), {
    target: { value: '+380501112233' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Надіслати код' }));
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Код з SMS (клієнт диктує)' })).toBeInTheDocument()
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Код з SMS (клієнт диктує)' }), {
    target: { value: '123456' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Барбер' })).toBeInTheDocument());
}

export async function refsLoaded() {
  await screen.findByRole('combobox', { name: 'Барбер' });
  await screen.findByRole('combobox', { name: 'Локація' });
  await screen.findByRole('combobox', { name: 'Послуга' });
  expect(await screen.findByRole('option', { name: 'Іван' })).toBeInTheDocument();
  expect(await screen.findByRole('option', { name: 'Сіті Лейк' })).toBeInTheDocument();
}

/** Локація → каталог послуг цієї локації завантажено (T-4738). */
export async function chooseLocation(value = 'loc-1') {
  fireEvent.change(screen.getByRole('combobox', { name: 'Локація' }), {
    target: { value },
  });
  await screen.findByRole('option', { name: 'Стрижка' });
}

/** Обрати послугу локації; її тривалість міряє слоти (T-4738). */
export async function chooseService(value = 'svc-1') {
  // Каталог локації приходить окремим запитом — чекаємо його, інакше вибір
  // не «прилипне» (опції ще немає) і слоти не запитаються.
  await screen.findByRole('option', { name: 'Стрижка' });
  fireEvent.change(screen.getByRole('combobox', { name: 'Послуга' }), {
    target: { value },
  });
}

// Без value — перша реальна опція зі списку: дати рахуються від сьогодні
// (dateOptionsFrom, 14 днів, без вихідних), тож фіксована дата в тесті
// старіє і випадає з вікна (слот-кнопки тоді не рендеряться взагалі).
export async function chooseDate(value?: string) {
  const dateCombobox = screen.getByRole('combobox', { name: 'Дата' }) as HTMLSelectElement;
  const picked = value ?? [...dateCombobox.options].find((o) => o.value !== '')?.value ?? '';
  expect(picked).not.toBe('');
  fireEvent.change(dateCombobox, { target: { value: picked } });
  await waitFor(() => expect(screen.queryByText(/завантаження слотів/i)).not.toBeInTheDocument());
}

export async function chooseBarber(value: string) {
  const barberCombobox = screen.getByRole('combobox', { name: 'Барбер' });
  fireEvent.change(barberCombobox, { target: { value } });
  await waitFor(() => expect(screen.queryByText(/завантаження слотів/i)).not.toBeInTheDocument());
}

export async function pickSlotByTime(start: string) {
  // Слоти відображаються клієнтським компонентом SlotPicker —
  // у тесті вони іграються як кнопки з aria-label «HH:mm – HH:mm».
  const buttons = screen.getAllByRole('button');
  // Fallback на текст — коли aria-label ще не встановлено.
  const target =
    buttons.find((btn) => (btn.getAttribute('aria-label') ?? '').includes(start)) ??
    buttons.find((btn) => (btn.textContent ?? '').includes(start));
  if (!target) {
    const all = buttons
      .map((btn) => `[aria-label="${btn.getAttribute('aria-label')}"] "${btn.textContent}"`)
      .join(' | ');
    throw new Error(`no slot button for ${start}; available=${all}`);
  }
  fireEvent.click(target);
  await waitFor(() =>
    expect(document.querySelector<HTMLInputElement>('[name="selectedStart"]')?.value).toBe(start)
  );
}
