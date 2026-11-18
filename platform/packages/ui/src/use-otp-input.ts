import { useId, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

export const OTP_LENGTH = 6;
const DIGITS_ONLY = /\D/g;

type InputEvent = KeyboardEvent<HTMLInputElement>;
type PasteEvent = ClipboardEvent<HTMLInputElement>;

/** Логіка OTP-комірок (цифри, Backspace, стрілки, paste) — окремо від розмітки. */
export function useOtpInput(
  value: string,
  onChange: (value: string) => void,
  onComplete?: (value: string) => void
) {
  const errorId = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const commit = (next: string) => {
    const digits = next.replace(DIGITS_ONLY, '').slice(0, OTP_LENGTH);
    onChange(digits);
    if (digits.length === OTP_LENGTH) onComplete?.(digits);
  };

  const focusAt = (index: number) => {
    refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  };

  const handleChange = (index: number) => (raw: string) => {
    const digit = raw.replace(DIGITS_ONLY, '').slice(-1);
    if (!digit) return;
    commit(value.slice(0, index) + digit + value.slice(index + 1));
    focusAt(index + 1);
  };

  const handleKeyDown = (index: number) => (event: InputEvent) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const removeAt = value[index] ? index : Math.max(0, index - 1);
      commit(value.slice(0, removeAt) + value.slice(removeAt + 1));
      focusAt(removeAt);
    } else if (event.key === 'ArrowLeft') {
      focusAt(index - 1);
    } else if (event.key === 'ArrowRight') {
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number) => (event: PasteEvent) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(DIGITS_ONLY, '');
    if (!digits) return;
    const next = value.slice(0, index) + digits + value.slice(index + digits.length);
    commit(next.slice(0, OTP_LENGTH));
    focusAt(index + digits.length);
  };

  return { errorId, refs, handleChange, handleKeyDown, handlePaste };
}
