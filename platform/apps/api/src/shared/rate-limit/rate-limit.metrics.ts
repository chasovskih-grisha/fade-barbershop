// Лічильник порушень rate limit (T-4410): росте при кожній відмові — читає
// /metrics (T-4204) як fade_rate_limit_violations_total.
import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitMetrics {
  private violations = 0;

  increment(): void {
    this.violations += 1;
  }

  get total(): number {
    return this.violations;
  }
}
