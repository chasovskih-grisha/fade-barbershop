export interface FiscalReceiptDetails {
  receiptId: string;
  fiscalCode?: string;
  status: 'CREATED' | 'DONE' | 'CANCELLED' | 'ERROR';
  total: number;
  error?: string;
}

export interface FiscalGateway {
  checkShiftOpen(params: {
    cashRegisterId?: string;
    traceId: string;
  }): Promise<{ isOpen: boolean; openedAt?: Date; isTooLong?: boolean }>;

  createReceipt(params: {
    paymentId: string;
    /** Візит для чеків салону; для замовлень магазину його немає. */
    appointmentId?: string;
    amount: number;
    type: 'prepayment' | 'sale' | 'return';
    items: Array<{ name: string; price: number; quantity: number }>;
    cashRegisterId?: string;
    traceId: string;
    customRelationId?: string;
  }): Promise<FiscalReceiptDetails>;

  getReceiptStatus(params: { receiptId: string; traceId: string }): Promise<FiscalReceiptDetails>;
}
