import { useEffect, useState } from 'react';

export function useHoldTimer(holdExpiry: string | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!holdExpiry) {
      setRemaining(0);
      return;
    }
    const target = new Date(holdExpiry).getTime();
    const tick = () => setRemaining(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [holdExpiry]);

  return remaining;
}
