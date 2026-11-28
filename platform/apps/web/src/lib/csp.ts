// T-4806: політика безпеки контенту для сайту. Nonce народжується на кожен
// запит у middleware; Next сам проставляє його на власні інлайн-скрипти, а
// `strict-dynamic` дозволяє довантажувати лише скрипти, які ініціював наш код.
// `style-src 'unsafe-inline'` лишається свідомо: Tailwind і next/font пишуть
// інлайн-стилі, а nonce на стилі Next не проставляє.

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "media-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}
