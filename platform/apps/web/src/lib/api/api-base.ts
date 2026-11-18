/** У браузері — той самий origin (next rewrite проксіює API і cookie). */
export function apiBase(): string {
  if (typeof window !== 'undefined') return '';
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.WEB_API_URL ??
    process.env.API_ORIGIN ??
    'http://localhost:13000'
  );
}
