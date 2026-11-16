import * as crypto from 'crypto';
import { PaymentBillingGateway, WebhookEvent } from '../src';

describe('PaymentBillingGateway', () => {
  let gateway: PaymentBillingGateway;
  const mockSecretKey = 'sk_test_mock123';
  const mockWebhookSecret = 'whsec_mock456';

  beforeEach(() => {
    gateway = new PaymentBillingGateway(mockSecretKey, mockWebhookSecret);
  });

  test('should create checkout session successfully with tax and tip calculations', async () => {
    const session = await gateway.createCheckoutSession({
      appointmentId: 'apt_101',
      customerId: 'cust_202',
      customerEmail: 'john@example.com',
      amountCents: 4500,
      tipAmountCents: 500,
      taxAmountCents: 371,
      currency: 'usd',
    });

    expect(session.sessionId).toContain('cs_test_');
    expect(session.checkoutUrl).toContain('https://checkout.stripe.com');
    expect(session.status).toBe('pending');
    expect(session.subtotalCents).toBe(4500);
    expect(session.tipAmountCents).toBe(500);
    expect(session.taxAmountCents).toBe(371);
    expect(session.totalCents).toBe(5371);
    expect(session.expiresAt).toBeDefined();
  });

  test('should throw error when creating checkout session with zero or negative amount', async () => {
    await expect(
      gateway.createCheckoutSession({
        appointmentId: 'apt_101',
        customerId: 'cust_202',
        customerEmail: 'john@example.com',
        amountCents: 0,
        currency: 'usd',
      })
    ).rejects.toThrow('Invalid payment amount');
  });

  test('should verify valid cryptographic HMAC webhook signature and payload', () => {
    const payloadObject: WebhookEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_789',
          amount: 4500,
          currency: 'usd',
          receipt_email: 'john@example.com',
          metadata: { appointmentId: 'apt_101', customerId: 'cust_202' },
        },
      },
    };

    const payloadString = JSON.stringify(payloadObject);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hmacSignature = crypto
      .createHmac('sha256', mockWebhookSecret)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');

    const validSignatureHeader = `t=${timestamp},v1=${hmacSignature}`;

    const event = gateway.verifyAndConstructWebhookEvent(payloadString, validSignatureHeader);
    expect(event.id).toBe('evt_123');
    expect(event.type).toBe('payment_intent.succeeded');
  });

  test('should reject invalid webhook signature header', () => {
    const payloadString = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' });
    expect(() => {
      gateway.verifyAndConstructWebhookEvent(payloadString, 'invalid_header');
    }).toThrow('Invalid Stripe webhook signature header');
  });

  test('should reject webhook signature with mismatched HMAC hash', () => {
    const payloadString = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded' });
    const timestamp = '1620000000';
    const invalidSignatureHeader = `t=${timestamp},v1=wrong_hash`;

    expect(() => {
      gateway.verifyAndConstructWebhookEvent(payloadString, invalidSignatureHeader);
    }).toThrow('Webhook signature verification failed');
  });

  test('should generate itemized invoice correctly with tax and tip breakdown', () => {
    const event: WebhookEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_789',
          amount: 6000,
          currency: 'usd',
          receipt_email: 'client@fade.com',
          metadata: { appointmentId: 'apt_555', customerId: 'cust_777', tipCents: '500' },
        },
      },
    };

    const invoice = gateway.generateInvoice(event, ['Executive Fade', 'Beard Trim']);
    expect(invoice.invoiceId).toContain('inv_');
    expect(invoice.totalCents).toBe(6000);
    expect(invoice.tipCents).toBe(500);
    expect(invoice.taxCents).toBe(495); // 8.25% of 6000
    expect(invoice.items.length).toBe(2);
    expect(invoice.status).toBe('paid');
    expect(invoice.receiptUrl).toBeDefined();
  });

  test('should process refund successfully', async () => {
    const refund = await gateway.processRefund({
      paymentIntentId: 'pi_789',
      amountCents: 6000,
      reason: 'requested_by_customer',
    });

    expect(refund.refundId).toContain('re_');
    expect(refund.paymentIntentId).toBe('pi_789');
    expect(refund.amountCents).toBe(6000);
    expect(refund.status).toBe('succeeded');
  });

  test('should throw error on negative refund amount', async () => {
    await expect(
      gateway.processRefund({
        paymentIntentId: 'pi_789',
        amountCents: -100,
      })
    ).rejects.toThrow('Invalid refund amount');
  });

  test('should calculate tip split correctly across barbers using hours worked', () => {
    const splitResults = gateway.calculateTipSplit(10000, {
      barberPercentage: 80, // 80% direct split ($80), 20% pool ($20)
      poolAllocationType: 'hours_worked',
      barbers: [
        { barberId: 'barber_1', hoursWorked: 40, serviceRevenueCents: 200000 },
        { barberId: 'barber_2', hoursWorked: 10, serviceRevenueCents: 50000 },
      ],
    });

    expect(splitResults.length).toBe(2);
    // Direct split per barber: 8000 / 2 = 4000
    // Pool split: 2000 allocated by hours (40 vs 10 -> 4:1 ratio -> 1600 vs 400)
    expect(splitResults[0].barberId).toBe('barber_1');
    expect(splitResults[0].tipShareCents).toBe(4000 + 1600); // 5600
    expect(splitResults[1].barberId).toBe('barber_2');
    expect(splitResults[1].tipShareCents).toBe(4000 + 400); // 4400
  });

  test('should generate automated payout ledger correctly', () => {
    const ledger = gateway.generatePayoutLedger('shop_nyc_01', '2026-11-15', [
      {
        barberId: 'barber_1',
        completedAppointments: 8,
        grossServiceRevenueCents: 60000,
        commissionRate: 0.60,
        totalTipsCents: 5600,
        deductionsCents: 500,
      },
    ]);

    expect(ledger.shopId).toBe('shop_nyc_01');
    expect(ledger.payoutDate).toBe('2026-11-15');
    expect(ledger.ledgerRows.length).toBe(1);
    // Service earnings: 60000 * 0.60 = 36000
    // Tips: 5600
    // Deductions: 500
    // Net: 36000 + 5600 - 500 = 41100
    expect(ledger.ledgerRows[0].serviceEarningsCents).toBe(36000);
    expect(ledger.ledgerRows[0].netPayoutCents).toBe(41100);
    expect(ledger.totalPayoutCents).toBe(41100);
  });

  test('should create recurring subscription successfully', async () => {
    const sub = await gateway.createSubscription({
      customerId: 'cust_vip_1',
      customerEmail: 'vip@fade.com',
      planId: 'plan_unlimited_haircut',
      amountCents: 9900,
      currency: 'usd',
      interval: 'month',
    });

    expect(sub.subscriptionId).toContain('sub_');
    expect(sub.status).toBe('active');
    expect(sub.amountCents).toBe(9900);
    expect(sub.currentPeriodEnd).toBeDefined();
  });

  test('should calculate franchise royalties and marketing fund deductions correctly', () => {
    const statement = gateway.calculateFranchiseRoyalties('shop_la_02', 1000000, 6.0, 2.0);
    expect(statement.shopId).toBe('shop_la_02');
    expect(statement.grossRevenueCents).toBe(1000000);
    expect(statement.royaltyFeeCents).toBe(60000); // 6%
    expect(statement.marketingFundFeeCents).toBe(20000); // 2%
    expect(statement.totalDeductionCents).toBe(80000);
    expect(statement.netShopRevenueCents).toBe(920000);
    expect(statement.status).toBe('calculated');
  });

  test('should track payment dispute and generate dispute evidence package', () => {
    const event: WebhookEvent = {
      id: 'evt_disp_1',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_chargeback_99',
          amount: 7500,
          currency: 'usd',
          metadata: { dispute_reason: 'fraudulent' },
        },
      },
    };

    const dispute = gateway.trackDispute(event);
    expect(dispute.disputeId).toContain('dp_');
    expect(dispute.paymentIntentId).toBe('pi_chargeback_99');
    expect(dispute.status).toBe('needs_response');

    const evidence = gateway.generateDisputeEvidence(dispute.disputeId, {
      appointmentId: 'apt_888',
      customerEmail: 'client@fade.com',
      serviceName: 'Executive Haircut & Beard',
      completedAt: '2026-11-14T14:00:00Z',
      receiptUrl: 'https://pay.stripe.com/receipts/rcpt_123',
    });

    expect(evidence.disputeId).toBe(dispute.disputeId);
    expect(evidence.appointmentId).toBe('apt_888');
    expect(evidence.summary).toContain('Dispute defense package');
  });
});
