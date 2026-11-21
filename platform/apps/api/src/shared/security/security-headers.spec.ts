import type { NextFunction, Request, Response } from 'express';
import { buildSecurityHeaders, securityHeaders } from './security-headers';

function fakeResponse() {
  const set = jest.fn();
  return { setHeader: set } as unknown as Response & { setHeader: jest.Mock };
}

function fakeRequest(headers: Record<string, string>, path = '/health') {
  return { secure: false, headers, path } as unknown as Request;
}

describe('buildSecurityHeaders', () => {
  it('always denies framing, sniffing and referrer leaks', () => {
    const headers = buildSecurityHeaders({ secure: false });

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['Content-Security-Policy']).toBe("default-src 'none'; frame-ancestors 'none'");
  });

  it('omits HSTS on a plain-HTTP request', () => {
    expect(buildSecurityHeaders({ secure: false })['Strict-Transport-Security']).toBeUndefined();
  });

  it('sends HSTS over TLS', () => {
    expect(buildSecurityHeaders({ secure: true })['Strict-Transport-Security']).toBe(
      'max-age=63072000; includeSubDomains; preload'
    );
  });

  it('drops the strict CSP for Swagger UI, which needs inline scripts', () => {
    expect(
      buildSecurityHeaders({ secure: true, docs: true })['Content-Security-Policy']
    ).toBeUndefined();
  });
});

describe('securityHeaders middleware', () => {
  it('sets every header on a JSON response and continues the chain', () => {
    const response = fakeResponse();
    const next = jest.fn() as NextFunction;

    securityHeaders(fakeRequest({}, '/appointments'), response, next);

    expect(response.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'"
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('trusts the proxy proto header to detect HTTPS', () => {
    const response = fakeResponse();

    securityHeaders(fakeRequest({ 'x-forwarded-proto': 'https' }), response, jest.fn());

    expect(response.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  });

  it('keeps HSTS off a direct plain-HTTP request', () => {
    const response = fakeResponse();

    securityHeaders(fakeRequest({}), response, jest.fn());

    expect(response.setHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.anything()
    );
  });

  it('leaves the docs page without CSP but still framed off', () => {
    const response = fakeResponse();

    securityHeaders(fakeRequest({}, '/docs'), response, jest.fn());

    expect(response.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(response.setHeader).not.toHaveBeenCalledWith(
      'Content-Security-Policy',
      expect.anything()
    );
  });
});
