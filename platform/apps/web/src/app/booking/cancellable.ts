/** Runs a request with cancellation support and consistent loading/error wiring. */
export function cancellable<T>(
  request: Promise<T>,
  handlers: {
    onSuccess: (value: T) => void;
    onError?: (() => void) | undefined;
    setLoading?: ((value: boolean) => void) | undefined;
  }
): () => void {
  let cancelled = false;
  handlers.setLoading?.(true);
  request
    .then((value) => {
      if (!cancelled) handlers.onSuccess(value);
    })
    .catch(() => {
      if (!cancelled) handlers.onError?.();
    })
    .finally(() => {
      if (!cancelled) handlers.setLoading?.(false);
    });
  return () => {
    cancelled = true;
  };
}

export const noopCleanup = () => undefined;
