'use client';

// Тости адмінки: state-хук + вʼюпорт на UI-кітових Toast/ToastViewport.
// Успіхи — тости, що самі зникають; помилки лишаються inline (role=alert),
// бо їх не можна «проморгати».
import { useCallback, useRef, useState } from 'react';
import { Toast, ToastViewport, type ToastTone } from '@fade/ui';

export interface AdminToast {
  id: number;
  title: string;
  tone: ToastTone;
  description?: string | undefined;
}

const AUTO_DISMISS_MS = 4000;

export function useAdminToasts() {
  const [toasts, setToasts] = useState<AdminToast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((title: string, tone: ToastTone = 'success', description?: string) => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, title, tone, description }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const viewport = (
    <ToastViewport className="sm:left-auto sm:right-0">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          tone={toast.tone}
          description={toast.description}
          duration={AUTO_DISMISS_MS}
          onClose={() => dismiss(toast.id)}
        />
      ))}
    </ToastViewport>
  );

  return { push, viewport };
}
