import { Injectable } from '@nestjs/common';
import { FiscalGateway, FiscalReceiptDetails } from '../domain/fiscal.gateway.interface';

@Injectable()
export class CheckboxFiscalGateway implements FiscalGateway {
  private receipts = new Map<
    string,
    {
      status: 'CREATED' | 'DONE' | 'CANCELLED' | 'ERROR';
      total: number;
      fiscalCode?: string;
      error?: string;
    }
  >();
  private shiftOpenedAt: Date | null = new Date(Date.now() - 2 * 3600 * 1000);

  setShiftOpenedAt(date: Date | null) {
    this.shiftOpenedAt = date;
  }

  async checkShiftOpen(_params: {
    cashRegisterId?: string;
    traceId: string;
  }): Promise<{ isOpen: boolean; openedAt?: Date; isTooLong?: boolean }> {
    if (!this.shiftOpenedAt) {
      return { isOpen: false };
    }
    const ageMs = Date.now() - this.shiftOpenedAt.getTime();
    const isTooLong = ageMs > 24 * 3600 * 1000;
    return {
      isOpen: true,
      openedAt: this.shiftOpenedAt,
      isTooLong,
    };
  }

  async createReceipt(params: {
    paymentId: string;
    appointmentId: string;
    amount: number;
    type: 'prepayment' | 'sale' | 'return';
    items: Array<{ name: string; price: number; quantity: number }>;
    cashRegisterId?: string;
    traceId: string;
    customRelationId?: string;
  }): Promise<FiscalReceiptDetails> {
    if (params.amount <= 0) {
      throw new Error('receipt.zero_payment_after_rounding: amount must be greater than zero');
    }

    const shift = await this.checkShiftOpen({
      ...(params.cashRegisterId ? { cashRegisterId: params.cashRegisterId } : {}),
      traceId: params.traceId,
    });
    if (!shift.isOpen) {
      throw new Error('shift.not_opened: Cash register shift is not open');
    }
    if (shift.isTooLong) {
      throw new Error('shift.opened_too_long: Shift open longer than 24 hours');
    }

    const receiptId = `rcpt_${params.paymentId}_${Date.now()}`;
    const fiscalCode = `fc_${Math.floor(Math.random() * 1000000)}`;

    this.receipts.set(receiptId, {
      status: 'DONE',
      total: params.amount,
      fiscalCode,
    });

    return {
      receiptId,
      fiscalCode,
      status: 'DONE',
      total: params.amount,
    };
  }

  async getReceiptStatus(params: {
    receiptId: string;
    traceId: string;
  }): Promise<FiscalReceiptDetails> {
    const r = this.receipts.get(params.receiptId);
    if (!r) {
      throw new Error(`Receipt not found: ${params.receiptId}`);
    }
    return {
      receiptId: params.receiptId,
      ...(r.fiscalCode ? { fiscalCode: r.fiscalCode } : {}),
      status: r.status,
      total: r.total,
      ...(r.error ? { error: r.error } : {}),
    };
  }
}
