/** Failure-isolating circuit breaker for external gateways (T-5021). */

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerOptions {
  /** Consecutive failures that trip the breaker. */
  readonly failureThreshold: number;
  /** Time the breaker stays open before allowing a trial call. */
  readonly cooldownMs: number;
  /** Trial calls allowed while half-open (default 1). */
  readonly halfOpenMaxAttempts?: number;
  /** Injectable clock for deterministic tests. */
  readonly now?: () => number;
}

export interface CircuitSnapshot {
  readonly state: CircuitState;
  readonly consecutiveFailures: number;
  readonly rejectedCalls: number;
  readonly halfOpenAttempts: number;
  readonly openedAtMs: number | null;
  readonly lastFailureAtMs: number | null;
}

export class CircuitOpenError extends Error {
  constructor() {
    super('circuit_open');
    this.name = 'CircuitOpenError';
  }
}

/**
 * Consecutive-failure breaker. Opens after `failureThreshold` failures, rejects
 * traffic for `cooldownMs`, then lets a single trial through; a trial success
 * closes the circuit and a trial failure re-opens it.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private rejectedCalls = 0;
  private halfOpenAttempts = 0;
  private openedAtMs: number | null = null;
  private lastFailureAtMs: number | null = null;
  private readonly halfOpenMaxAttempts: number;
  private readonly now: () => number;

  constructor(private readonly options: CircuitBreakerOptions) {
    if (!Number.isInteger(options.failureThreshold) || options.failureThreshold < 1) {
      throw new Error('failureThreshold must be a positive integer');
    }
    if (!Number.isFinite(options.cooldownMs) || options.cooldownMs < 0) {
      throw new Error('cooldownMs must be a non-negative number');
    }
    this.halfOpenMaxAttempts = Math.max(1, options.halfOpenMaxAttempts ?? 1);
    this.now = options.now ?? (() => Date.now());
  }

  get snapshot(): CircuitSnapshot {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      rejectedCalls: this.rejectedCalls,
      halfOpenAttempts: this.halfOpenAttempts,
      openedAtMs: this.openedAtMs,
      lastFailureAtMs: this.lastFailureAtMs,
    };
  }

  /** Runs `work`, short-circuiting to `fallback` while the breaker is open. */
  async execute<T>(work: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    this.refreshState();
    if (this.state === 'open' || this.state === 'half_open') {
      if (this.state === 'half_open' && this.halfOpenAttempts < this.halfOpenMaxAttempts) {
        this.halfOpenAttempts += 1;
      } else {
        this.rejectedCalls += 1;
        if (fallback) return fallback();
        throw new CircuitOpenError();
      }
    }

    try {
      const result = await work();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private refreshState(): void {
    if (this.state !== 'open' || this.openedAtMs === null) return;
    if (this.now() - this.openedAtMs >= this.options.cooldownMs) {
      this.state = 'half_open';
      this.halfOpenAttempts = 0;
    }
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'closed';
    this.halfOpenAttempts = 0;
    this.openedAtMs = null;
  }

  private recordFailure(): void {
    this.consecutiveFailures += 1;
    this.lastFailureAtMs = this.now();
    if (this.state === 'half_open' || this.consecutiveFailures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAtMs = this.now();
      this.halfOpenAttempts = 0;
    }
  }
}
