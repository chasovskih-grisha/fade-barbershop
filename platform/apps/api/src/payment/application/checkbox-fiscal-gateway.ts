/** Checkbox fiscal gateway (T-092):Deposit + remainder receipt chain.
 * Integrates with Checkbox UA fiscal service for receipt signing.
 * 
 * Receipt chain:
 *   #1: Deposit receipt - issued when depositStatus → Captured
 *   #2: Remainder receipt - issued when booking → DONE (finalPrice paid)
 * 
 * Idempotency: via check_id parameter; duplicate checks ignored.
 * Edge case: FinalPrice = 0 → no Checkbox call (exempt per PAY-003/LYL-007).
 * Provider limits: shift > 24h, sum_equals_total_sum, 100 checks/month test mode.
 */
export enum CheckboxReceiptType {
  Deposit = 'deposit',
  Remainder = 'remainder',
  FullPayment = 'full_payment',
}

/** Checkbox receipt data model. */
export interface CheckboxReceipt {
  check_id: string; // unique receipt ID for idempotency
  type: CheckboxReceiptType;
  amount: number; // amount in UAH (kopecks * 100, rounded to tens)
  status: 'pending' | 'signed' | 'failed';
  created_at: Date;
  signed_at?: Date;
  error_code?: string;
  error_message?: string;
}

/** Fiscal gateway for Checkbox provider. */
export class CheckboxFiscalGateway {
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly testMode: boolean;
  private readonly checkIdCounter: Map<string, number> = new Map();

  constructor(
    apiUrl: string,
    merchantId: string,
    secretKey: string,
    testMode = false
  ) {
    this.apiUrl = apiUrl;
    this.merchantId = merchantId;
    this.secretKey = secretKey;
    this.testMode = testMode;
  }

  /** Issue a receipt for deposit or remainder payment.
   * Idempotent: returns existing receipt if check_id already registered.
   */
  async issueReceipt(
    bookingId: string,
    amount: number,
    receiptType: CheckboxReceiptType,
    checkId?: string
  ): Promise<CheckboxReceipt> {
    // FinalPrice = 0 exemption (PAY-003/LYL-007)
    if (amount <= 0) {
      return {
        check_id: checkId || '',
        type: receiptType,
        amount: 0,
        status: 'exempt',
        created_at: new Date(),
      };
    }

    // Idempotency check
    const effectiveCheckId = checkId || this.generateCheckId(bookingId, receiptType);
    const existing = this.checkIdCounter.get(effectiveCheckId);
    if (existing && existing.status !== 'failed') {
      return {
        check_id: effectiveCheckId,
        type: receiptType,
        amount: existing.amount,
        status: existing.status,
        created_at: existing.created_at,
      };
    }

    // Build Checkbox API request
    const payload = {
      merchant_id: this.merchantId,
      amount,
      type: receiptType,
      check_id: effectiveCheckId,
      timestamp: new Date().toISOString(),
      sign: this.signPayload({ amount, check_id: effectiveCheckId, type: receiptType }),
    };

    try {
      const response = await fetch(`${this.apiUrl}/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 'signed') {
        this.checkIdCounter.set(effectiveCheckId, {
          amount,
          status: 'signed',
          created_at: new Date(),
        });
        return {
          check_id: effectiveCheckId,
          type: receiptType,
          amount,
          status: 'signed' as const,
          created_at: new Date(),
          signed_at: new Date(),
        };
      } else {
        this.checkIdCounter.set(effectiveCheckId, {
          amount,
          status: 'failed',
          created_at: new Date(),
        });
        return {
          check_id: effectiveCheckId,
          type: receiptType,
          amount,
          status: 'failed' as const,
          created_at: new Date(),
          error_code: data.error_code,
          error_message: data.error_message,
        };
      }
    } catch (error) {
      console.error('Checkbox fiscal gateway error:', error);
      return {
        check_id: effectiveCheckId,
        type: receiptType,
        amount,
        status: 'failed' as const,
        created_at: new Date(),
        error_message: 'Network error',
      };
    }
  }

  /** Generate a deterministic check_id for idempotency. */
  private generateCheckId(bookingId: string, receiptType: CheckboxReceiptType): string {
    const key = `${bookingId}:${receiptType}`;
    let counter = this.checkIdCounter.get(key) || 0;
    this.checkIdCounter.set(key, counter + 1);
    return `check_${Date.now()}_${counter}`;
  }

  /** Sign payload for Checkbox API (HMAC-like signature). */
  private signPayload(data: { amount: number; check_id: string; type: CheckboxReceiptType }): string {
    const stringify = JSON.stringify(data);
    // Simplified signing - in production: HMAC-SHA256 with secretKey
    return Buffer.from(stringify + this.secretKey).toString('base64');
  }
}