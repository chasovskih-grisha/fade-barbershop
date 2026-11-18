'use client';

import { useState, useEffect } from 'react';

export function useLoginTimers(step: 1 | 2) {
  const [resendTimer, setResendTimer] = useState(0);
  const [codeTimer, setCodeTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  useEffect(() => {
    if (step === 2 && codeTimer === 0) setCodeTimer(300);
    if (codeTimer <= 0) return;
    const timer = setInterval(() => {
      setCodeTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, codeTimer]);

  return { resendTimer, setResendTimer, codeTimer };
}
