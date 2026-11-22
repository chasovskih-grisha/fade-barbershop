import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';

function clock(start = 1_000): { now: () => number; advance: (ms: number) => void } {
  let current = start;
  return { now: () => current, advance: (ms) => (current += ms) };
}

function failing(): Promise<never> {
  return Promise.reject(new Error('gateway_down'));
}

describe('circuit breaker (T-5021)', () => {
  it('stays closed while calls succeed', async () => {
    const time = clock();
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 5_000,
      now: time.now,
    });
    await expect(breaker.execute(async () => 'ok')).resolves.toBe('ok');
    expect(breaker.snapshot.state).toBe('closed');
    expect(breaker.snapshot.consecutiveFailures).toBe(0);
  });

  it('opens after consecutive failures and rejects without fallback', async () => {
    const time = clock();
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      cooldownMs: 5_000,
      now: time.now,
    });
    await expect(breaker.execute(failing)).rejects.toThrow('gateway_down');
    await expect(breaker.execute(failing)).rejects.toThrow('gateway_down');
    expect(breaker.snapshot.state).toBe('open');
    await expect(breaker.execute(async () => 'never')).rejects.toBeInstanceOf(CircuitOpenError);
    expect(breaker.snapshot.rejectedCalls).toBe(1);
  });

  it('serves the fallback while open', async () => {
    const time = clock();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 1_000,
      now: time.now,
    });
    await expect(breaker.execute(failing)).rejects.toThrow();
    await expect(breaker.execute(async () => 'primary', () => 'fallback')).resolves.toBe(
      'fallback'
    );
  });

  it('allows one trial after the cooldown and closes on success', async () => {
    const time = clock();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 1_000,
      now: time.now,
    });
    await expect(breaker.execute(failing)).rejects.toThrow();
    time.advance(1_000);
    await expect(breaker.execute(async () => 'trial')).resolves.toBe('trial');
    expect(breaker.snapshot.state).toBe('closed');
  });

  it('re-opens when the half-open trial fails', async () => {
    const time = clock();
    const breaker = new CircuitBreaker({
      failureThreshold: 1,
      cooldownMs: 1_000,
      now: time.now,
    });
    await expect(breaker.execute(failing)).rejects.toThrow();
    time.advance(1_000);
    await expect(breaker.execute(failing)).rejects.toThrow('gateway_down');
    expect(breaker.snapshot.state).toBe('open');
    expect(breaker.snapshot.openedAtMs).toBe(time.now());
  });
});
