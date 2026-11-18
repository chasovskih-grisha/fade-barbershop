'use client';

// Фокус і анонси кроків (T-053au/T-053av): перехід між кроками переносить фокус
// у вміст нового кроку — інакше він лишається на елементі, якого вже немає
// (картка послуги після «Далі»), і скрін-рідер мовчить. Поява помилки сабміту
// переносить фокус на alert. Перший рендер не чіпаємо: стрибок фокуса при
// завантаженні сторінки — антипатерн.
import { useEffect, useRef } from 'react';

export function useStepFocus(step: number, error: string) {
  const stepRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    stepRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  return { stepRef, errorRef };
}
