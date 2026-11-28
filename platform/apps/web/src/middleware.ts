import { NextResponse, type NextRequest } from 'next/server';
import { buildCsp, createNonce } from './lib/csp';

// T-4806: CSP з криптографічним nonce на кожен запит. Заголовки транспорту
// (HSTS, X-Frame-Options, nosniff) уже стоять у next.config.js — тут лише те,
// що вимагає per-request значення.
export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  return response;
}

// Статика й іконки не потребують політики: без HTML там немає що виконувати.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/).*)'],
};
