import { act, renderHook } from '@testing-library/react';
import { prefersReducedMotion, useReducedMotion } from './useReducedMotion';

type Listener = (event: MediaQueryListEvent) => void;

/** jsdom не має matchMedia — підставляємо керований двійник (без моків
 * бізнес-коду: це поліфіл середовища, як `ResizeObserver` у тестах). */
function installMatchMedia(matches: boolean) {
  const listeners = new Set<Listener>();
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  };
  (window as unknown as { matchMedia: unknown }).matchMedia = () => mql;
  return {
    emit(next: boolean) {
      mql.matches = next;
      listeners.forEach((l) => l({ matches: next } as MediaQueryListEvent));
    },
  };
}

afterEach(() => {
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe('prefersReducedMotion', () => {
  it('хибний без matchMedia (SSR/jsdom) — рух лишається увімкненим', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('читає поточне значення медіа-запиту', () => {
    installMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('useReducedMotion', () => {
  it('реагує на зміну налаштування під час роботи', () => {
    const media = installMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => media.emit(true));
    expect(result.current).toBe(true);

    act(() => media.emit(false));
    expect(result.current).toBe(false);
  });

  it('початковий стан бере з matchMedia', () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
