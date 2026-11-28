/** @jest-environment node */
import { NextRequest } from 'next/server';
import { config, middleware } from '../middleware';
import { buildCsp } from '../lib/csp';

// T-4806: middleware — справжній вхід Next, а не окрема функція політики.
const call = (path: string) => middleware(new NextRequest(`https://fade.com.ua${path}`));

describe('web CSP middleware (T-4806)', () => {
  it('ставить політику з nonce, що збігається з x-nonce запиту', () => {
    const response = call('/locations/KYY-01');
    const csp = response.headers.get('Content-Security-Policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

    expect(nonce).toBeTruthy();
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it('не повторює nonce між запитами', () => {
    const first = call('/').headers.get('Content-Security-Policy');
    const second = call('/').headers.get('Content-Security-Policy');

    expect(first).not.toBe(second);
  });

  it('пропускає статику повз політику (matcher)', () => {
    expect(config.matcher[0]).toContain('_next/static');
  });
});

describe('buildCsp (T-4806)', () => {
  it('дозволяє лише власні та nonce-скрипти, без unsafe-inline', () => {
    const csp = buildCsp('abc123');

    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });
});
