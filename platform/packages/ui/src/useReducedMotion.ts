import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** T-4510c: чи просить користувач скороченого руху (WCAG 2.3.3).
 * JS-анімації мусять читати це, а не покладатися лише на CSS-медіа-запит. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches === true;
}

/** T-4510c: реактивна версія для JS-анімацій (Toast/Modal/Sheet).
 * Без `matchMedia` (SSR, jsdom без поліфіла) — рух увімкнено: краще
 * анімувати, ніж зламати рендер. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const mql = window.matchMedia?.(QUERY);
    if (!mql) return undefined;
    setReduced(mql.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
