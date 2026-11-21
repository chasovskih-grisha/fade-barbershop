/* eslint-disable max-lines, max-params -- cohesive module (141 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f | 1 signature whose 4-param contract is fixed by existing call sites (worst: an existing definition, limit 3); API redesign tracked in T-2500f */
// Специфікація T-197: депозит при прийнятті слота з черги.
// Репозиторій — у памʼяті, провайдер платежів і фіскальний gateway — фейки,
// тож перевіряємо саме бізнес-правила, а не мережу.
import { DEFAULT_DEPOSIT_POLICY } from '../../scheduling/domain/deposit-terms';
import { PaymentStatus } from '../../billing/domain/payment-status.enum';
import {
  CheckboxReceiptType,
  WaitlistDepositFlow,
  createInMemoryWaitlistPaymentRepository,
  type DepositCaptureGateway,
  type DepositReceiptIssuer,
  type WaitlistDepositInput,
} from './waitlist-deposit-flow.use-case';

function input(overrides: Partial<WaitlistDepositInput> = {}): WaitlistDepositInput {
  return {
    waitlistId: 'wl-1',
    clientId: 'client-1',
    slotId: 'slot-1',
    finalPrice: 333,
    occurredAt: new Date('2026-11-19T10:00:00.000Z'),
    ...overrides,
  };
}

function gateway(
  result: boolean | Error = true
): DepositCaptureGateway & { calls: Array<[string, number]> } {
  const calls: Array<[string, number]> = [];
  return {
    calls,
    async capture(paymentId, amount) {
      calls.push([paymentId, amount]);
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

/** Фейковий gateway повторює контракт Checkbox: check_id — ключ ідемпотентності. */
function receiptIssuer(): DepositReceiptIssuer & {
  calls: Array<{ amount: number; type: CheckboxReceiptType }>;
} {
  const calls: Array<{ amount: number; type: CheckboxReceiptType }> = [];
  const issued = new Map<string, Awaited<ReturnType<DepositReceiptIssuer['issueReceipt']>>>();
  return {
    calls,
    async issueReceipt(
      _bookingId: string,
      amount: number,
      receiptType: CheckboxReceiptType,
      checkId?: string
    ) {
      const existing = checkId ? issued.get(checkId) : undefined;
      if (existing) return existing;

      const receipt =
        amount <= 0
          ? {
              check_id: checkId ?? '',
              type: receiptType,
              amount: 0,
              status: 'exempt' as const,
              created_at: new Date(),
            }
          : {
              check_id: checkId ?? `check_${amount}`,
              type: receiptType,
              amount,
              status: 'signed' as const,
              created_at: new Date(),
              signed_at: new Date(),
            };

      calls.push({ amount, type: receiptType });
      issued.set(receipt.check_id, receipt);
      return receipt;
    },
  };
}

function harness(
  options: { policy?: typeof DEFAULT_DEPOSIT_POLICY; capture?: boolean | Error } = {}
) {
  const captureGateway = gateway(options.capture ?? true);
  const fiscal = receiptIssuer();
  const flow = new WaitlistDepositFlow({
    paymentRepo: createInMemoryWaitlistPaymentRepository(),
    depositPolicy: async () => options.policy ?? DEFAULT_DEPOSIT_POLICY,
    paymentGateway: captureGateway,
    checkboxGateway: fiscal,
  });
  return { flow, captureGateway, fiscal };
}

describe('WaitlistDepositFlow', () => {
  it('collects 30% of the price rounded to tens (PAY-ADM-09)', async () => {
    const { flow, captureGateway, fiscal } = harness();

    const result = await flow.execute(input());

    expect(result.depositAmount).toBe(100);
    expect(result.requiresBalance).toBe(true);
    expect(result.depositAmount).toBe(100);
    expect(result.payment.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(captureGateway.calls).toHaveLength(1);
    expect(fiscal.calls).toEqual([{ amount: 100, type: 'deposit' }]);
    // PAY-006: ключ чека детермінований — повтор не створить другий чек.
    expect(result.depositReceipt?.check_id).toBe('deposit_wl-1');
  });

  it('never charges more than the visit price', async () => {
    const { flow } = harness();

    const result = await flow.execute(input({ finalPrice: 20 }));

    expect(result.depositAmount).toBe(10);
    expect(result.depositAmount).toBeLessThanOrEqual(20);
  });

  it('does not charge when the deposit policy is disabled', async () => {
    const { flow, captureGateway, fiscal } = harness({
      policy: { ...DEFAULT_DEPOSIT_POLICY, percent: 0 },
    });

    const result = await flow.execute(input());

    expect(result.depositAmount).toBe(0);
    expect(result.requiresBalance).toBe(false);
    expect(result.payment.status).toBe(PaymentStatus.PAID);
    expect(captureGateway.calls).toHaveLength(0);
    expect(fiscal.calls).toHaveLength(0);
  });

  it('is idempotent: a second call reuses the paid deposit', async () => {
    const { flow, captureGateway, fiscal } = harness();

    const first = await flow.execute(input());
    const second = await flow.execute(input());

    expect(second.payment.id).toBe(first.payment.id);
    expect(second.payment.status).toBe(PaymentStatus.DEPOSIT_PAID);
    expect(second.depositAmount).toBe(first.depositAmount);
    expect(captureGateway.calls).toHaveLength(1);
    expect(fiscal.calls).toHaveLength(1);
  });

  it('cancels the payment when the provider declines', async () => {
    const { flow, fiscal } = harness({ capture: false });

    const result = await flow.execute(input());

    expect(result.payment.status).toBe(PaymentStatus.CANCELLED);
    expect(result.depositAmount).toBe(0);
    expect(result.requiresBalance).toBe(true);
    expect(result.depositReceipt).toBeNull();
    expect(fiscal.calls).toHaveLength(0);
  });

  it('cancels the payment when the provider throws', async () => {
    const { flow } = harness({ capture: new Error('provider timeout') });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await flow.execute(input());

    expect(result.payment.status).toBe(PaymentStatus.CANCELLED);
    expect(result.depositAmount).toBe(0);
    errorSpy.mockRestore();
  });
});
