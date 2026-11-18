'use client';

// RumReporter — точка монтування RUM (T-4204): порожній компонент, який
// реєструє збір Core Web Vitals після гідратації. Сама реєстрація ідемпотентна,
// тож StrictMode/HMR не подвоюють семпли.
import { useEffect } from 'react';
import { initRum } from '@/lib/rum';

export function RumReporter() {
  useEffect(() => {
    initRum();
  }, []);
  return null;
}
