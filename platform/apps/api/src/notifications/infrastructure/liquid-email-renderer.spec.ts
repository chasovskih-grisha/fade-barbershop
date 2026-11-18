import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { renderEmailTemplate, resolveTemplatesRoot } from './liquid-email-renderer';

describe('liquid email renderer', () => {
  it('знаходить шаблони поруч із рендерером і в dist webpack-бандла', () => {
    expect(fs.existsSync(path.join(resolveTemplatesRoot(__dirname), 'layouts/letter.liquid'))).toBe(
      true
    );

    const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'fade-mail-'));
    const layouts = path.join(dist, 'notifications/templates/layouts');
    fs.mkdirSync(layouts, { recursive: true });
    fs.writeFileSync(path.join(layouts, 'letter.liquid'), '');
    expect(resolveTemplatesRoot(dist)).toBe(path.join(dist, 'notifications/templates'));
  });

  it('кидає зрозумілу помилку, якщо теки шаблонів немає', () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'fade-mail-empty-'));
    expect(() => resolveTemplatesRoot(empty)).toThrow(/Email templates not found/);
  });

  it('екранує HTML, лишає текст сирим і тримає спільну верстку', () => {
    const data = {
      brand: 'FADE',
      when: '',
      rows: [{ label: 'Майстер', value: 'Oleh <test> & "x"' }],
    };
    const html = renderEmailTemplate('booking-confirmation', 'html', data);
    const text = renderEmailTemplate('booking-confirmation', 'text', data);

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('role="presentation"');
    // верстка бере токени email.*, а не локальні кольори (T-4611c)
    expect(html).toContain('background-color:#F4F1EA');
    expect(html).toContain('<img');
    expect(html).toContain('alt="FADE — Barbershop"');
    expect(html).toContain('Oleh &lt;test&gt;');
    expect(html).toContain('&quot;x&quot;');
    expect(html).toContain('успішно заброньовано');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('Oleh <test>');
    expect(text).toContain('Oleh <test> & "x"');
    expect(text).toContain('зателефонуйте');
  });

  it('прибирає зайві пробіли в темі', () => {
    expect(
      renderEmailTemplate('booking-confirmation', 'subject', { brand: 'FADE', when: '', rows: [] })
    ).toBe('FADE: візит записано');
  });

  it('падає, якщо шаблону або змінної немає', () => {
    expect(() => renderEmailTemplate('missing-letter', 'subject', {})).toThrow(
      /missing-letter\/subject/
    );
    expect(() =>
      renderEmailTemplate('booking-confirmation', 'subject', { when: '', rows: [] })
    ).toThrow(/booking-confirmation\/subject/);
  });
});
