import { CheckboxFiscalGateway } from './checkbox-fiscal.gateway';

describe('CheckboxFiscalGateway', () => {
  let gateway: CheckboxFiscalGateway;

  beforeEach(() => {
    gateway = new CheckboxFiscalGateway();
  });

  it('creates receipt and returns DONE status with fiscal code', async () => {
    const result = await gateway.createReceipt({
      paymentId: 'pay_1',
      appointmentId: 'apt_1',
      amount: 300,
      type: 'prepayment',
      items: [{ name: 'Deposit 30%', price: 300, quantity: 1 }],
      traceId: 'tr_1',
    });

    expect(result.status).toBe('DONE');
    expect(result.receiptId).toBeDefined();
    expect(result.fiscalCode).toBeDefined();
    expect(result.total).toBe(300);

    const status = await gateway.getReceiptStatus({ receiptId: result.receiptId, traceId: 'tr_1' });
    expect(status.status).toBe('DONE');
  });

  it('rejects zero or negative amount (PAY-003)', async () => {
    await expect(
      gateway.createReceipt({
        paymentId: 'pay_2',
        appointmentId: 'apt_2',
        amount: 0,
        type: 'prepayment',
        items: [{ name: 'Zero', price: 0, quantity: 1 }],
        traceId: 'tr_2',
      }),
    ).rejects.toThrow('zero_payment_after_rounding');
  });

  it('rejects when shift is closed', async () => {
    gateway.setShiftOpenedAt(null);
    await expect(
      gateway.createReceipt({
        paymentId: 'pay_3',
        appointmentId: 'apt_3',
        amount: 300,
        type: 'prepayment',
        items: [{ name: 'Deposit', price: 300, quantity: 1 }],
        traceId: 'tr_3',
      }),
    ).rejects.toThrow('shift.not_opened');
  });

  it('rejects when shift is open > 24 hours', async () => {
    gateway.setShiftOpenedAt(new Date(Date.now() - 26 * 3600 * 1000));
    await expect(
      gateway.createReceipt({
        paymentId: 'pay_4',
        appointmentId: 'apt_4',
        amount: 300,
        type: 'prepayment',
        items: [{ name: 'Deposit', price: 300, quantity: 1 }],
        traceId: 'tr_4',
      }),
    ).rejects.toThrow('shift.opened_too_long');
  });
});
