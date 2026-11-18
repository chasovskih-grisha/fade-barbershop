// Картка верифікованого клієнта у формі візиту (§6.2, T-046): імʼя, VIP,
// лічильник візитів. Ключова вимога — помилка профілю **не** блокує створення
// візиту, тож тест фіксує саме м'яку деградацію з повтором.

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VerifiedClientCard } from './VerifiedClientCard';

const CLIENT = {
  name: 'Олена Клієнт',
  phone: '+380501112233',
  vipDiscountPercent: 10,
  loyaltyVisitsCount: 3,
};

const ok = (body: object) => ({ ok: true, status: 200, json: async () => body });

function renderCard(clientId = 'user-1') {
  return render(<VerifiedClientCard phone="+380501112233" clientId={clientId} />);
}

describe('VerifiedClientCard', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('показує імʼя, VIP-знижку і лічильник візитів', async () => {
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async () => ok(CLIENT));
    renderCard();
    expect(await screen.findByText('Олена Клієнт')).toBeInTheDocument();
    expect(screen.getByText(/VIP −10%/)).toBeInTheDocument();
    expect(screen.getByText(/Візитів: 3/)).toBeInTheDocument();
  });

  it('не показує VIP, коли знижки немає', async () => {
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async () => ok({ ...CLIENT, vipDiscountPercent: null }));
    renderCard();
    await screen.findByText('Олена Клієнт');
    expect(screen.queryByText(/VIP/)).toBeNull();
    expect(screen.getByText(/Візитів: 3/)).toBeInTheDocument();
  });

  it('без імені — чесний стан, а не порожній рядок', async () => {
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async () => ok({ ...CLIENT, name: null }));
    renderCard();
    expect(await screen.findByText('Клієнт без імені')).toBeInTheDocument();
  });

  it('помилка профілю не блокує форму: рядок із повтором', async () => {
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async () => ({ ok: false, status: 500, json: async () => ({}) }));
    renderCard();
    await waitFor(() =>
      expect(screen.getByText(/Профіль клієнта недоступний/)).toBeInTheDocument()
    );
    expect(screen.getByText('Перезавантажити профіль')).toBeInTheDocument();
  });

  it('повтор запиту після помилки показує профіль', async () => {
    let attempt = 0;
    // prettier-ignore
    (global.fetch as jest.Mock).mockImplementation(async () => {
      attempt += 1;
      return attempt === 1 ? { ok: false, status: 500, json: async () => ({}) } : ok(CLIENT);
    });
    renderCard();
    fireEvent.click(await screen.findByText('Перезавантажити профіль'));
    expect(await screen.findByText('Олена Клієнт')).toBeInTheDocument();
  });

  it('без clientId не робить запит і нічого не рендерить', () => {
    renderCard('');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Верифікований клієнт')).toBeNull();
  });
});
