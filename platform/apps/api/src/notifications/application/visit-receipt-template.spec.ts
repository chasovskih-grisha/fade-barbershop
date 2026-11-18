import { renderReceiptHtml, renderReceiptSubject, renderReceiptText } from './visit-receipt-template';

describe('visit-receipt-template (T-4611c)', () => {
  const DATA = {
    serviceName: 'Beard Trim & Haircut',
    barberName: 'Oleh',
    amountPaid: '1200 UAH',
    start: '5 жовтня 2026 о 13:00',
  };

  it('renders receipt subject correctly', () => {
    expect(renderReceiptSubject(DATA)).toBe('FADE: чек за візит');
  });

  it('renders receipt text correctly without HTML', () => {
    const text = renderReceiptText(DATA);
    expect(text).toContain('Послуга: Beard Trim & Haircut');
    expect(text).toContain('Сума: 1200 UAH');
    expect(text).not.toContain('<table');
  });

  it('renders receipt html using primitives', () => {
    const html = renderReceiptHtml(DATA);
    expect(html).toContain('<table role="presentation"');
    expect(html).toContain('Beard Trim &amp; Haircut');
    expect(html).toContain('1200 UAH');
    expect(html).not.toContain('<script');
  });
});
