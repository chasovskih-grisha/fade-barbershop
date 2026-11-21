import type { NextFunction, Request, Response } from 'express';

export interface SecurityHeaderOptions {
  secure: boolean;
  docs?: boolean;
}

const BASE_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

const HSTS = 'max-age=63072000; includeSubDomains; preload';

// Swagger UI ships its own inline script and style bundle, so `default-src 'none'`
// would blank the docs page. JSON responses keep the strict policy.
const DOCS_PATHS = ['/docs', '/openapi'];

// HSTS is only meaningful over TLS: sending it from a plain-HTTP dev host
// teaches the browser a rule it cannot honour.
export function buildSecurityHeaders({
  secure,
  docs = false,
}: SecurityHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (docs) delete headers['Content-Security-Policy'];
  if (secure) headers['Strict-Transport-Security'] = HSTS;
  return headers;
}

function isDocsPath(path: string | undefined): boolean {
  return DOCS_PATHS.some((base) => path === base || path?.startsWith(`${base}/`) === true);
}

export function securityHeaders(request: Request, response: Response, next: NextFunction): void {
  const secure = request.secure || request.headers['x-forwarded-proto'] === 'https';
  const headers = buildSecurityHeaders({ secure, docs: isDocsPath(request.path) });
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  next();
}
