'use client';

// Хук команд візита (T-045): POST /admin/appointments/:id/:action.
// Актор — cookie-сесія адміна, не тіло. Успіх — onDone (перезавантажити календар).
import { useState } from 'react';

export function useVisitCommand(visitId: string, onDone: () => void) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async (action: string, body: object): Promise<boolean> => {
    setBusy(true);
    setError('');
    const response = await fetch(`/admin/appointments/${visitId}/${action}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (response.ok) {
      onDone();
      return true;
    }
    setError(
      response.status === 409 ? 'Слот зайнятий або перехід недоступний' : 'Не вдалося виконати дію'
    );
    return false;
  };

  return { error, busy, post };
}
