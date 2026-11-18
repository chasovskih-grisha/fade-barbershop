// «Записати» з картки клієнта CRM (T-046, admin-screens §6.2): адмін створює
// візит із передобраним клієнтом. Ключове в контракті — у запит іде `User.id`
// (`client.userId`), а не `ClientProfile.id`: телефонний запис резолвить картку
// через `by-user/:userId` і пише той самий id в `origin.clientId`, а візити
// клієнта читаються за `User.id` — профільний id дав би візит, невидимий у
// кабінеті (розбір у T-046).

import { render, screen, fireEvent } from '@testing-library/react';
import ClientDetailPage from './page';
import type { ClientDetail } from './client-types';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'profile-1' }),
  useRouter: () => ({ push: mockPush }),
}));

// Профільний id навмисно відрізняється від userId: на цій парі й ловиться
// регресія «підставили ClientProfile.id» (у сіді вони збігаються, тому живий
// прогін її не показує).
const client = (over: Partial<ClientDetail> = {}): ClientDetail => ({
  id: 'profile-1',
  userId: 'user-1',
  name: 'Олена Клієнт',
  phone: '+380501112233',
  preferences: [],
  notes: [],
  vipDiscountPercent: 10,
  loyaltyVisitsCount: 3,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
  ...over,
});

const respond = (payload: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(payload) } as Response);

const BOOK_PATH = '/bookings/phone?clientId=user-1&phone=%2B380501112233';

describe('ClientDetailPage — «Записати» з картки клієнта (T-046)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockPush.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('веде на телефонний запис із clientId = User.id, не ClientProfile.id', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond(client()));
    render(<ClientDetailPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Записати' }));
    expect(mockPush).toHaveBeenCalledWith(BOOK_PATH);
  });

  it('картку читає за профільним id, а запис веде за userId', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond(client()));
    render(<ClientDetailPage />);
    await screen.findByRole('button', { name: 'Записати' });
    expect(global.fetch).toHaveBeenCalledWith('/admin/clients/profile-1', {
      credentials: 'include',
    });
  });

  it('клієнт без імені й без VIP: дія лишається доступною', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      respond(client({ name: null, vipDiscountPercent: null }))
    );
    render(<ClientDetailPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Записати' }));
    expect(mockPush).toHaveBeenCalledWith(BOOK_PATH);
  });

  it('помилка завантаження — банер і жодної дії «Записати»', async () => {
    (global.fetch as jest.Mock).mockReturnValue(respond({}, 500));
    render(<ClientDetailPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не вдалося завантажити клієнта');
    expect(screen.queryByRole('button', { name: 'Записати' })).toBeNull();
  });
});
