// Cookie adapter for the web session (ADR 0017, T-4614d).
// Prod: client cookie on Domain=.fade.com.ua, admin cookie on admin.fade.com.ua.
// Stage: host-only (no Domain). .com.ua is a public suffix, so a parent-domain
// cookie set on stage would also be sent to fade.com.ua.
// HttpOnly, SameSite=Lax. Secure is env-controlled (dev over HTTP turns it off).

import type { SessionChannel } from '../domain/session';

export interface CookieConfig {
  clientDomain: string; // empty = host-only
  adminDomain: string;
  secure: boolean;
}

const PROD_CLIENT_DOMAIN = '.fade.com.ua';
const PROD_ADMIN_DOMAIN = 'admin.fade.com.ua';

const STAGE_COOKIE_ERROR =
  'Stage session cookies must be host-only. Set FADE_CLIENT_DOMAIN and FADE_ADMIN_DOMAIN to empty strings so a stage login cannot reach fade.com.ua.';

export function cookieConfigFromEnv(env: NodeJS.ProcessEnv = process.env): CookieConfig {
  if (env.NODE_ENV === 'stage') return stageCookieConfig(env);
  return {
    clientDomain: env.FADE_CLIENT_DOMAIN ?? PROD_CLIENT_DOMAIN,
    adminDomain: env.FADE_ADMIN_DOMAIN ?? PROD_ADMIN_DOMAIN,
    secure: env.COOKIE_SECURE === 'true',
  };
}

function stageCookieConfig(env: NodeJS.ProcessEnv): CookieConfig {
  if (env.FADE_CLIENT_DOMAIN !== '' || env.FADE_ADMIN_DOMAIN !== '') {
    throw new Error(STAGE_COOKIE_ERROR);
  }
  return { clientDomain: '', adminDomain: '', secure: env.COOKIE_SECURE === 'true' };
}

export const DEFAULT_COOKIE_CONFIG: CookieConfig = cookieConfigFromEnv();

export const SESSION_COOKIE_NAME = 'fadoidx';

export function buildSetCookie(
  token: string,
  channel: SessionChannel,
  config: CookieConfig
): string {
  return `${SESSION_COOKIE_NAME}=${token}; Max-Age=2592000; ${cookieFlags(channel, config)}`;
}

export function buildClearCookie(channel: SessionChannel, config: CookieConfig): string {
  const flags = domainFlags(channel, config).concat([
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ]);
  return `${SESSION_COOKIE_NAME}=; ${flags.join('; ')}`;
}

function cookieFlags(channel: SessionChannel, config: CookieConfig): string {
  const flags = domainFlags(channel, config).concat([
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(config.secure ? ['Secure'] : []),
  ]);
  return flags.join('; ');
}

function domainFlags(channel: SessionChannel, config: CookieConfig): string[] {
  const domain = channel === 'admin' ? config.adminDomain : config.clientDomain;
  return domain ? [`Domain=${domain}`] : [];
}

/** Whether a browser would attach this Set-Cookie on a later request to requestHost. */
export function cookieReachesHost(
  setCookie: string,
  issuerHost: string,
  requestHost: string
): boolean {
  const match = /(?:^|;\s*)Domain=([^;]+)/i.exec(setCookie);
  if (!match?.[1]) return issuerHost.toLowerCase() === requestHost.toLowerCase();
  const domain = match[1].trim().replace(/^\./, '').toLowerCase();
  const host = requestHost.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}
