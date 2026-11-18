export interface InvoiceDetails {
  invoiceId: string;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  customerVatId?: string;
  issuedAt: Date;
}

export interface AcquiringGateway {
  createPaymentSession(params: {
    paymentId: string;
    amount: number;
    currency: string;
    traceId: string;
    successUrl: string;
    cancelUrl: string;
    automaticCapture?: boolean;
    customerVatId?: string;
  }): Promise<{ checkoutUrl: string; providerSessionId: string; captureStatus?: 'automatic' | 'manual'; invoice?: InvoiceDetails }>;

  refundPayment(params: {
    providerSessionId: string;
    amount: number;
    reason: string;
    traceId: string;
    feeReversalAmount?: number;
  }): Promise<{ refundId: string; feeReversed?: number; refundedAmount?: number }>;

  verifyPaymentStatus(params: {
    paymentId: string;
    providerSessionId: string;
    traceId: string;
  }): Promise<{ status: 'succeeded' | 'pending' | 'failed'; amountReceived?: number; invoice?: InvoiceDetails }>;
}
