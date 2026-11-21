'use client';

import { useEffect, useState } from 'react';
import { createRandomEvent, INITIAL_EVENTS, type FunnelTelemetryEvent } from './funnel-telemetry';

export function useFunnelTelemetry() {
  const [events, setEvents] = useState<FunnelTelemetryEvent[]>(INITIAL_EVENTS);
  const [isLivePaused, setIsLivePaused] = useState(false);

  useEffect(() => {
    if (isLivePaused) return;
    const interval = setInterval(() => {
      setEvents((prev) => [createRandomEvent(), ...prev.slice(0, 5)]);
    }, 6000);

    return () => clearInterval(interval);
  }, [isLivePaused]);

  const togglePause = () => setIsLivePaused((paused) => !paused);

  return { events, isLivePaused, togglePause };
}
