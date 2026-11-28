export type OnsiteForm = 'cash' | 'pos';

export interface OnsiteReceipt {
  check_id: string;
  status: 'pending' | 'signed' | 'failed' | 'exempt';
  error_message?: string;
}

export interface OnsiteStatus {
  bookingId: string;
  finalPrice: number;
  depositAmount: number;
  amountDue: number;
  outstanding: number;
  paymentStatus: string;
  form: OnsiteForm | null;
  receipt: OnsiteReceipt | null;
}

export const RECEIPT_LABELS: Record<OnsiteReceipt['status'], string> = {
  pending: 'Чек у черзі',
  signed: 'Чек підписано',
  failed: 'Чек не пройшов',
  exempt: 'Без чека (безоплатний візит)',
};

export const FORM_LABELS: Record<OnsiteForm, string> = {
  cash: 'Готівка',
  pos: 'POS-термінал',
};
