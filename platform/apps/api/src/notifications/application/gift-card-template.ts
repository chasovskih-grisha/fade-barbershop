import { renderEmailTemplate } from '../infrastructure/liquid-email-renderer';
import { httpUrl, toLetterRows } from './letter-fields';

export interface GiftCardData {
  purchaserName?: string;
  recipientName?: string;
  amount?: string;
  code?: string;
  expiresAt?: string;
  message?: string;
  redeemUrl?: string;
  brand?: string;
}

function giftRows(data: GiftCardData): [string, string][] {
  const rows: [string, string][] = [];
  if (data.amount) rows.push(['Номінал', data.amount]);
  if (data.expiresAt) rows.push(['Дійсна до', data.expiresAt]);
  if (data.message) rows.push(['Повідомлення', data.message]);
  return rows;
}

function view(data: GiftCardData, brand: string): Record<string, unknown> {
  return {
    brand,
    purchaserName: data.purchaserName ?? '',
    recipientName: data.recipientName ?? '',
    amount: data.amount ?? '',
    code: data.code ?? '',
    expiresAt: data.expiresAt ?? '',
    message: data.message ?? '',
    redeemUrl: httpUrl(data.redeemUrl),
    rows: toLetterRows(giftRows(data)),
  };
}

export function renderGiftCardSubject(data: GiftCardData, brand = 'FADE'): string {
  return renderEmailTemplate('gift-card', 'subject', view(data, brand));
}

export function renderGiftCardText(data: GiftCardData, brand = 'FADE'): string {
  return renderEmailTemplate('gift-card', 'text', view(data, brand));
}

export function renderGiftCardHtml(data: GiftCardData, brand = 'FADE'): string {
  return renderEmailTemplate('gift-card', 'html', view(data, brand));
}
