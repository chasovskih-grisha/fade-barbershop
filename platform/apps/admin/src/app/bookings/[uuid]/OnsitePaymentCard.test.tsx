import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OnsitePaymentCard } from './OnsitePaymentCard';

const STATUS = {
  bookingId: 'bk-1',
  finalPrice: 500,
  depositAmount: 150,
  amountDue: 350,
  outstanding: 350,
  paymentStatus: 'unpaid',
  form: null,
  receipt: null,
};

const response = (body: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(body),
  } as Response);

describe('OnsitePaymentCard (T-093)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the server remainder and marks it paid without editable amount', async () => {
    let paid = false;
    (global.fetch as jest.Mock).mockImplementation((url: string, init?: RequestInit) => {
      if (url.endsWith('/onsite') && init?.method === 'POST') {
        paid = true;
        return response({ outcome: 'captured' });
      }
      return response(
        paid
          ? {
              ...STATUS,
              outstanding: 0,
              paymentStatus: 'paid',
              form: 'cash',
              receipt: { check_id: 'remainder_bk-1', status: 'signed' },
            }
          : STATUS
      );
    });

    render(<OnsitePaymentCard bookingId="bk-1" />);

    expect(await screen.findByText('350 ₴')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Позначити оплату \(Готівка\)/i }));

    expect(await screen.findByText('Решту сплачено.')).toBeInTheDocument();
    expect(screen.getByText(/Чек підписано · remainder_bk-1/)).toBeInTheDocument();
    const post = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) => url === '/admin/payments/onsite' && init?.method === 'POST'
    );
    expect(JSON.parse(post?.[1]?.body as string)).toEqual({ bookingId: 'bk-1', form: 'cash' });
  });

  it('sends POS when the terminal form is chosen', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, init?: RequestInit) =>
      url.endsWith('/onsite') && init?.method === 'POST'
        ? response({ outcome: 'captured' })
        : response(STATUS)
    );

    render(<OnsitePaymentCard bookingId="bk-1" />);
    fireEvent.click(await screen.findByLabelText('POS-термінал'));
    fireEvent.click(screen.getByRole('button', { name: /Позначити оплату \(POS-термінал\)/i }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/admin/payments/onsite',
        expect.objectContaining({ body: JSON.stringify({ bookingId: 'bk-1', form: 'pos' }) })
      )
    );
  });
});
