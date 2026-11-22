/** Multi-currency money and cached FX conversion (T-5004). */

export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

export interface FxRate {
  readonly from: string;
  readonly to: string;
  readonly rate: number;
  readonly asOf: Date;
}

export class MissingFxRateError extends Error {
  constructor(from: string, to: string) {
    super(`No FX rate for ${from}->${to}`);
    this.name = 'MissingFxRateError';
  }
}

function rateKey(from: string, to: string): string {
  return `${from}->${to}`;
}

/** TTL cache over an upstream rate feed; stale rates are never used. */
export class FxRateCache {
  private readonly rates = new Map<string, FxRate>();

  constructor(
    private readonly ttlMs = 60_000,
    private readonly nowMs: () => number = Date.now
  ) {}

  set(rate: FxRate): void {
    this.rates.set(rateKey(rate.from, rate.to), rate);
  }

  get(from: string, to: string): FxRate | undefined {
    const rate = this.rates.get(rateKey(from, to));
    if (!rate) return undefined;
    const age = this.nowMs() - rate.asOf.getTime();
    return age <= this.ttlMs && age >= 0 ? rate : undefined;
  }

  convert(money: Money, to: string): Money {
    if (money.currency === to) return { ...money };
    const rate = this.get(money.currency, to);
    if (!rate) throw new MissingFxRateError(money.currency, to);
    return { amountMinor: Math.round(money.amountMinor * rate.rate), currency: to };
  }
}
