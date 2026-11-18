// TTL-конфіг токенів mobile-сесії (T-014): env → секунди, рахує сервер (Clock).
// Access — хвилини (коротке життя), refresh — тижні. Клієнт ніколи не вирішує
// «протух/не протух» — тільки серверний Clock (ризик clock-drift зі спеки).

/** TTL access-токена (сек), дефолт 15 хв. */
export function accessTtlSec(): number {
  const raw = Number(process.env.FADE_ACCESS_TTL_SEC ?? '');
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 15 * 60;
}

/** TTL refresh-токена (сек) від видачі/останньої ротації, дефолт 30 днів. */
export function refreshTtlSec(): number {
  const raw = Number(process.env.FADE_REFRESH_TTL_SEC ?? '');
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 30 * 24 * 60 * 60;
}
