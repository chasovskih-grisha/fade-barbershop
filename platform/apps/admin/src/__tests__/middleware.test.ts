/** @jest-environment node */
import { NextRequest } from 'next/server';
import { config, middleware } from '../middleware';
import { buildCsp } from '../lib/csp';

// T-4806: адмінка отримує власну, вужчу політику — жодних зовнішніх джерел.
const call = () => middleware(new NextRequest('https://admin.fade.com.ua/bookings'));

describe('admin CSP middleware (T-4806)', () => {
  it('ставить CSP з nonce на кожну відповідь', () => {
    const response = call();
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

    expect(nonce).toBeTruthy();
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toMatch(/connect-src 'self' https:/);
  });

  it('не пропускає жодного стороннього джерела скриптів', () => {
    const csp = buildCsp('n1');
    const scriptSrc = csp.split('; ').find((directive) => directive.startsWith('script-src')) ?? '';

    expect(scriptSrc).toBe("script-src 'self' 'nonce-n1' 'strict-dynamic'");
    expect(scriptSrc).not.toContain('https:');
  });

  it('matcher знімає політику лише зі статики Next', () => {
    expect(config.matcher[0]).toContain('_next/static');
  });
});
