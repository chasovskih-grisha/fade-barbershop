import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useReducedMotion } from './useReducedMotion';

/** T-4510c: рух входу діалогу. Коли користувач просить скорочений рух
 * (WCAG 2.3.3), перехід зводиться до 0 мс — елементи з'являються одразу. */
export function useDialogMotion(open: boolean, durationMs: number) {
  const reducedMotion = useReducedMotion();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return undefined;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const duration = reducedMotion ? 0 : durationMs;
  const entering = !entered && !reducedMotion;

  const overlayStyle: CSSProperties = {
    opacity: entering ? 0 : 1,
    transitionProperty: 'opacity',
    transitionDuration: `${duration}ms`,
  };
  const panelStyle: CSSProperties = {
    opacity: entering ? 0 : 1,
    transform: entering ? 'translateY(8px) scale(0.98)' : 'none',
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
  };
  return { overlayStyle, panelStyle };
}
