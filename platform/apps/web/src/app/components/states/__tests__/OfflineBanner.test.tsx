import { render, screen, fireEvent, act } from '@testing-library/react';
import { OfflineBanner } from '../OfflineBanner';
import mockStates from '../../../../../messages/uk/states.json';

// Офлайн-стан (T-4513): сервер про з’єднання не знає, браузер — знає.
// Банер з’являється на offline і зникає, щойно мережа повернулася.
// Тексти — з каталогу `states` (T-4612b), тому next-intl замокано на uk-каталог.

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => (mockStates as Record<string, string>)[key] ?? key,
}));

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true });
}

describe('OfflineBanner', () => {
  it('не показується, поки мережа є', () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });

  it('показує пояснення, коли мережі немає', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status').textContent).toContain('Немає з’єднання з інтернетом');
  });

  it('зникає після відновлення мережі (подія online)', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getAllByRole('status')).toHaveLength(1);

    act(() => {
      setOnline(true);
      fireEvent(window, new Event('online'));
    });
    expect(screen.queryAllByRole('status')).toHaveLength(0);
  });
});
