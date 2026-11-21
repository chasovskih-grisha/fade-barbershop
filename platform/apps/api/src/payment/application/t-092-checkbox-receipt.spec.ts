/* eslint-disable max-lines, max-params -- cohesive module (115 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Специфікація T-092: чек депозиту, закриваючий чек решти, повний продаж,
// нульовий візит без звернення до Checkbox (PAY-003) і `sum_equals_total_sum`.
import { Booking } from '../../scheduling/domain/booking';
import type { DepositPolicy } from '../../scheduling/domain/deposit-terms';
import { CheckboxReceiptType, type CheckboxReceipt } from './checkbox-fiscal-gateway';
import { T092CheckboxReceipt, type ReceiptLookup } from './t-092-checkbox-receipt.use-case';

const START = new Date('2026-12-01T09:00:00.000Z');
const AT = new Date('2026-12-01T09:05:00.000Z');

function booking(
  price = 500,
  overrides: { requiresPayment?: boolean; depositPolicy?: DepositPolicy } = {}
): Booking {
  return Booking.create({
    barberId: 'barber-1',
    locationId: 'loc-1',
    clientId: 'client-1',
    start: START,
    end: new Date(START.getTime() + 30 * 60_000),
    agreedPrice: price,
    finalPrice: price,
    requiresPayment: overrides.requiresPayment ?? true,
    ...(overrides.depositPolicy ? { depositPolicy: overrides.depositPolicy } : {}),
  });
}

function gateway(): ReceiptLookup & {
  calls: Array<{ amount: number; type: CheckboxReceiptType }>;
} {
  const calls: Array<{ amount: number; type: CheckboxReceiptType }> = [];
  const issued = new Map<string, CheckboxReceipt>();
  return {
    calls,
    async issueReceipt(bookingId, amount, type, checkId): Promise<CheckboxReceipt> {
      calls.push({ amount, type });
      const receipt: CheckboxReceipt = {
        check_id: checkId ?? `check_${bookingId}`,
        type,
        amount,
        status: 'signed',
        created_at: AT,
        signed_at: AT,
      };
      issued.set(receipt.check_id, receipt);
      return receipt;
    },
    findReceipt(checkId: string): CheckboxReceipt | null {
      return issued.get(checkId) ?? null;
    },
  };
}

function useCase(): { receipts: T092CheckboxReceipt; gateway: ReturnType<typeof gateway> } {
  const fiscal = gateway();
  return { receipts: new T092CheckboxReceipt(fiscal, () => AT), gateway: fiscal };
}

describe('T092CheckboxReceipt (T-092)', () => {
  it('issues the deposit receipt for the snapshot amount', async () => {
    const target = booking();
    const { receipts, gateway: fiscal } = useCase();

    const receipt = await receipts.issueDepositReceipt(target);

    expect(receipt).toMatchObject({
      check_id: `deposit_${target.id}`,
      type: CheckboxReceiptType.Deposit,
      amount: 150,
      status: 'signed',
    });
    expect(fiscal.calls).toEqual([{ amount: 150, type: CheckboxReceiptType.Deposit }]);
  });

  it('closes the chain with the remainder receipt', async () => {
    const target = booking();
    target.paymentMethod = 'cash';
    const { receipts } = useCase();

    const receipt = await receipts.issueRemainderReceipt(target);

    expect(receipt.amount).toBe(350);
    expect(receipt.type).toBe(CheckboxReceiptType.Remainder);
    expect(receipt.check_id).toBe(`remainder_${target.id}`);
  });

  it('issues a full-sale receipt for a visit without a deposit', async () => {
    const target = booking(500, {
      depositPolicy: { percent: 0, rounding: 10, cancellationWindowHours: 4 },
    });
    const { receipts } = useCase();

    const receipt = await receipts.issueFullPaymentReceipt(target);

    expect(receipt.type).toBe(CheckboxReceiptType.FullPayment);
    expect(receipt.amount).toBe(500);
  });

  it('never calls Checkbox for a free visit (PAY-003/LYL-007)', async () => {
    const target = booking(0, { requiresPayment: false });
    const { receipts, gateway: fiscal } = useCase();

    const receipt = await receipts.issueDepositReceipt(target);

    expect(receipt.status).toBe('exempt');
    expect(receipt.amount).toBe(0);
    expect(fiscal.calls).toHaveLength(0);
  });

  it('skips Checkbox when rounding leaves nothing to pay', async () => {
    const target = booking(20, {
      depositPolicy: { percent: 100, rounding: 1, cancellationWindowHours: 4 },
    });
    const { receipts, gateway: fiscal } = useCase();

    const receipt = await receipts.issueRemainderReceipt(target);

    expect(receipt.status).toBe('exempt');
    expect(fiscal.calls).toHaveLength(0);
  });

  it('validates sum_equals_total_sum for the chain', () => {
    const { receipts } = useCase();

    expect(receipts.validateAmount(500, 150, 350)).toBe(true);
    expect(receipts.validateAmount(500, 0, 500)).toBe(true);
    expect(receipts.validateAmount(500, 150, 500)).toBe(true);
    expect(receipts.validateAmount(500, 150, 0)).toBe(false);
    expect(receipts.validateAmount(500, 150, 150)).toBe(false);
  });

  it('reports the stored receipt status by check id', async () => {
    const target = booking();
    const { receipts } = useCase();

    await receipts.issueDepositReceipt(target);

    expect(receipts.getReceiptStatus(`deposit_${target.id}`)?.status).toBe('signed');
    expect(receipts.getReceiptStatus('missing')).toBeNull();
  });
});
