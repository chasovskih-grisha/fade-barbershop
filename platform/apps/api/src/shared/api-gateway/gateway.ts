/** Edge gateway: validate, resolve and project, within a latency budget (T-5003). */

import { GraphqlContract } from './graphql-contract';
import { ServiceRegistry } from './service-registry';
import type { GatewayResult, ProjectionError, Selection } from './gateway.types';

export interface EdgeGatewayOptions {
  readonly contract?: GraphqlContract;
  readonly services?: ServiceRegistry;
  readonly latencyBudgetMs?: number;
  readonly now?: () => number;
}

const DEFAULT_LATENCY_BUDGET_MS = 50;

export class EdgeGateway {
  private readonly contract: GraphqlContract;
  private readonly services: ServiceRegistry;
  private readonly latencyBudgetMs: number;
  private readonly now: () => number;

  constructor(options: EdgeGatewayOptions = {}) {
    this.contract = options.contract ?? new GraphqlContract();
    this.services = options.services ?? new ServiceRegistry();
    this.latencyBudgetMs = options.latencyBudgetMs ?? DEFAULT_LATENCY_BUDGET_MS;
    this.now = options.now ?? (() => Date.now());
  }

  get registry(): ServiceRegistry {
    return this.services;
  }

  async query(
    root: string,
    selection: readonly Selection[],
    resolve: () => Promise<Readonly<Record<string, unknown>>>
  ): Promise<GatewayResult> {
    const startedAt = this.now();
    const errors = this.contract.validate(root, selection);
    if (errors.length > 0) return this.result({}, errors, startedAt);
    try {
      const payload = await resolve();
      const data = this.contract.project(root, payload, selection);
      return this.result(data, [], startedAt);
    } catch {
      return this.result({}, [{ path: root, message: 'resolver_failed' }], startedAt);
    }
  }

  private result(
    data: Readonly<Record<string, unknown>>,
    errors: readonly ProjectionError[],
    startedAt: number
  ): GatewayResult {
    const elapsedMs = Math.max(0, this.now() - startedAt);
    return {
      data,
      errors,
      elapsedMs,
      withinLatencyBudget: elapsedMs <= this.latencyBudgetMs,
    };
  }
}
