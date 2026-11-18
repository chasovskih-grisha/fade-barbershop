import { emailLayout } from './email-layout';
import { emailLogo } from './email-logo';
import { emailTable, emailButton, emailText } from './email-blocks';
import { escapeHtml } from './email-escape';

describe('Email Layout Primitives (T-4611b)', () => {
  it('escapes HTML correctly', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('renders emailLayout with preheader, title, and body', () => {
    const html = emailLayout({
      preheader: 'Test preheader',
      title: 'Booking Confirmed',
      body: '<p>Hello</p>',
      footer: 'FADE Team',
    });
    expect(html).toContain('Test preheader');
    expect(html).toContain('Booking Confirmed');
    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('FADE Team');
    expect(html).toContain('role="presentation"');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://github.com');
  });

  it('emailLogo вставляє milk-lockup як data-URI з обовʼязковим alt', () => {
    const logoHtml = emailLogo('milk');
    expect(logoHtml).toContain('<img');
    expect(logoHtml).toContain('data:image/svg+xml;base64,');
    expect(logoHtml).toContain('alt="FADE — Barbershop"');
    // жодного зовнішнього хоста, який листовий клієнт міг би заблокувати
    expect(logoHtml).not.toContain('http');
  });

  it('emailLogo без асета падає на текстовий wordmark, а не лишає порожнечу', () => {
    const logoHtml = emailLogo('milk', '/nonexistent/lockup-on-milk.svg');
    expect(logoHtml).toContain('FADE');
    expect(logoHtml).not.toContain('<img');
  });

  it('renders emailTable with rows', () => {
    const tableHtml = emailTable([
      { label: 'Service', value: 'Fade & Beard' },
      { label: 'Time', value: '14:00' },
    ]);
    expect(tableHtml).toContain('Service');
    expect(tableHtml).toContain('Fade &amp; Beard');
    expect(tableHtml).toContain('14:00');
  });

  it('renders emailButton with label and href', () => {
    const btnHtml = emailButton('View Booking', 'https://fade.com.ua/booking/123');
    expect(btnHtml).toContain('View Booking');
    expect(btnHtml).toContain('https://fade.com.ua/booking/123');
  });

  it('renders emailText with variant', () => {
    const txtHtml = emailText('Important note', 'secondary');
    expect(txtHtml).toContain('Important note');
  });
});
