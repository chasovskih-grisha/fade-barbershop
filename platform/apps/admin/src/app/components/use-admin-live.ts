'use client';

// Живе оновлення адмінки (T-045): EventSource на /admin/live/events (той самий
// origin адмінки — next-rewrite проксіює потік на API, cookie сесії їде як
// same-origin). На кожну подію візиту викликаємо onEvent, який перечитує екран.
// Свідомо не патчимо стан із тіла події: сигнал лише запускає повний reload,
// тож цифри KPI і сітка календаря не розходяться.
import { useEffect, useRef } from 'react';

export function useAdminLive(onEvent: () => void): void {
  const handler = useRef(onEvent);

  // Свіжий callback без повторної підписки (ефект без deps — щорендера).
  useEffect(() => {
    handler.current = onEvent;
  });

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const source = new EventSource('/admin/live/events');
    source.addEventListener('appointment', () => handler.current());
    return () => source.close();
  }, []);
}
