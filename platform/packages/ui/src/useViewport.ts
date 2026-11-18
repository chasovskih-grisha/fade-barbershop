import { useState, useEffect, useCallback } from 'react';

export const ADMIN_LG_PX = 1024;

export type BreakpointState = { breakpoint: number };

export function useViewport() {
  const [breakpoint, setBreakpoint] = useState(ADMIN_LG_PX);

  const onResize = useCallback(() => {
    setBreakpoint(window.innerWidth);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);

  return { isLarge: breakpoint >= ADMIN_LG_PX, breakpoint, setBreakpoint };
}

export function breakpointBelow(current: number, threshold: number) {
  return current < threshold;
}
