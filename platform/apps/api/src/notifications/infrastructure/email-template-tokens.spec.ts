// T-4611c: листи живуть на email-токенах і на знаку бренду. Спека ловить
// повернення локальних кольорів, скриптів і зовнішніх ресурсів у шаблонах.
import fs from 'node:fs';
import path from 'node:path';
import { renderEmailTemplate, resolveTemplatesRoot } from './liquid-email-renderer';

const root = resolveTemplatesRoot(__dirname);

function liquidFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return liquidFiles(full);
    return entry.name.endsWith('.liquid') ? [full] : [];
  });
}

const templates = liquidFiles(root).map((file) => ({
  file: path.relative(root, file),
  body: fs.readFileSync(file, 'utf8'),
}));

describe('email templates on design tokens (T-4611c)', () => {
  it('знаходить шаблони для перевірки', () => {
    expect(templates.length).toBeGreaterThan(10);
  });

  it('не тримає жодного локального кольору — лише email.*', () => {
    const offenders = templates
      .filter(({ body }) => /#[0-9a-f]{3,8}\b/i.test(body))
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('не містить скриптів, зовнішніх стилів чи зовнішніх зображень', () => {
    const offenders = templates
      .filter(({ body }) => /<script/i.test(body))
      .concat(
        templates.filter(
          ({ body }) => /src\s*=\s*["']https?:/i.test(body) || /<link[^>]+stylesheet/i.test(body)
        )
      )
      .map(({ file }) => file);
    expect(offenders).toEqual([]);
  });

  it('layout ставить знак бренду з data-URI і з alt', () => {
    const html = renderEmailTemplate('booking-confirmation', 'html', { brand: 'FADE', rows: [] });
    expect(html).toContain('data:image/svg+xml;base64,');
    expect(html).toContain('alt="FADE — Barbershop"');
    expect(html).not.toContain('<script');
  });

  it('другий шаблон перевикористовує ті самі примітиви й знак', () => {
    const receipt = renderEmailTemplate('visit-receipt', 'html', {
      brand: 'FADE',
      amount: '500 ₴',
      rows: [],
    });
    const confirmation = renderEmailTemplate('booking-confirmation', 'html', {
      brand: 'FADE',
      rows: [],
    });
    const logo = receipt.slice(receipt.indexOf('data:image/svg+xml;base64,'), receipt.indexOf('alt='));
    expect(receipt).toContain('До сплати');
    expect(confirmation).toContain(logo);
  });
});
