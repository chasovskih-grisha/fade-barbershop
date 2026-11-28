import { fireEvent, render, screen } from '@testing-library/react';
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

const response = (body: unknown) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

describe('OnsitePaymentCard receipt state (T-093)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  it('offers retry for a paid visit whose fiscal receipt failed', async () => {
    let retried = false;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.endsWith('/receipt/retry')) {
        retried = true;
        return response({
          outcome: 'signed',
          receipt: { check_id: 'remainder_bk-1', status: 'signed' },
        });
      }
      return response({
        ...STATUS,
        outstanding: 0,
        paymentStatus: 'paid',
        form: 'cash',
        receipt: retried
          ? { check_id: 'remainder_bk-1', status: 'signed' }
          : { check_id: 'remainder_bk-1', status: 'failed', error_message: 'checkbox down' },
      });
    });

    render(<OnsitePaymentCard bookingId="bk-1" />);

    expect(await screen.findByText(/Чек не пройшов/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Повторити чек' }));

    expect(await screen.findByText(/Чек підписано · remainder_bk-1/)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      '/admin/payments/bookings/bk-1/onsite/receipt/retry',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('hides payment controls for a complimentary visit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      response({
        ...STATUS,
        finalPrice: 0,
        amountDue: 0,
        outstanding: 0,
        paymentStatus: 'complimentary',
      })
    );

    render(<OnsitePaymentCard bookingId="bk-1" />);

    expect(await screen.findByText(/Безоплатний візит/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Позначити оплату/i })).not.toBeInTheDocument();
  });
});
