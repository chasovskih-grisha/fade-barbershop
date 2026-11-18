// «Записати» без clientId (лише ?phone= або порожні параметри) → звичайний
// OTP-крок; номер із запиту підставляється у поле (T-046). Гілки з clientId —
// у page.preselect.test.tsx.

import { render, screen } from '@testing-library/react';
import PhoneBookingPage from './page';
import { mockFullStack } from './phone-test-helpers';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(globalThis.location.search),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/bookings/phone',
}));

describe('PhoneBookingPage — preselect без clientId: OTP-крок (T-046)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    window.history.replaceState({}, '', '/bookings/phone');
    jest.restoreAllMocks();
  });

  it('?phone без clientId → звичайний OTP-крок з підставленим номером', async () => {
    window.history.replaceState({}, '', '/bookings/phone?phone=%2B380777889900');
    mockFullStack({});
    render(<PhoneBookingPage />);
    expect(await screen.findByLabelText('Номер клієнта')).toHaveValue('+380777889900');
    expect(screen.getByRole('button', { name: 'Надіслати код' })).toBeInTheDocument();
  });

  it('порожній clientId і phone → звичайний OTP-крок (порожній номер)', async () => {
    window.history.replaceState({}, '', '/bookings/phone?clientId=&phone=');
    mockFullStack({});
    render(<PhoneBookingPage />);
    expect(await screen.findByLabelText('Номер клієнта')).toHaveValue('');
  });
});
