import { renderGiftCardHtml, renderGiftCardSubject, renderGiftCardText } from './gift-card-template';

describe('GiftCardTemplate', () => {
  const sampleData = {
    purchaserName: 'Олександр',
    recipientName: 'Марина',
    amount: '1000 ₴',
    code: 'GC-9876-XYZ',
    expiresAt: '2027-11-11',
    message: 'З днем народження!',
    redeemUrl: 'https://fade.barbershop/redeem?code=GC-9876-XYZ',
    brand: 'FADE',
  };

  test('renders subject correctly', () => {
    const subject = renderGiftCardSubject(sampleData);
    expect(subject).toContain('подарункову карту');
    expect(subject).toContain('Марина');
  });

  test('renders plain text without HTML tags', () => {
    const text = renderGiftCardText(sampleData);
    expect(text).toContain('GC-9876-XYZ');
    expect(text).toContain('1000 ₴');
    expect(text).not.toContain('<');
  });

  test('renders HTML layout with table and button', () => {
    const html = renderGiftCardHtml(sampleData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('GC-9876-XYZ');
    expect(html).toContain('1000 ₴');
    expect(html).toContain('З днем народження!');
    expect(html).toContain('https://fade.barbershop/redeem?code=GC-9876-XYZ');
    expect(html).toContain('role="presentation"');
  });

  test('escapes HTML special characters in inputs', () => {
    const malicious = {
      ...sampleData,
      recipientName: '<script>alert(1)</script>',
      message: '<b>Bold</b> & "quotes"',
    };
    const html = renderGiftCardHtml(malicious);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;b&gt;');
  });
});
