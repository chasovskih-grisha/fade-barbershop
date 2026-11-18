/** База API для мобільного клієнта. Локальний стенд — api (:13000). */
export function apiBase(): string {
  return process.env.MOBILE_API_BASE ?? 'http://localhost:13000';
}
