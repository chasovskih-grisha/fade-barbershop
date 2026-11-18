// Use case дашборда запуску (T-4439): вікно «перші 7 днів» за замовчуванням,
// 1..30 діб на вимогу. Повертає числа + гейти, щоб адмінка не рахувала
// пороги вдруге й не розходилась із бекендом.
import { Inject, Injectable } from '@nestjs/common';
import { launchGates, type LaunchCounters, type LaunchGates } from '../domain/launch-dashboard';
import { LAUNCH_METRICS_SOURCE, type LaunchMetricsSource } from './launch-dashboard.ports';

export const LAUNCH_WINDOW_DAYS = 7;
export const MAX_WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

export interface LaunchDashboardView {
  range: { from: string; to: string; days: number };
  counters: LaunchCounters;
  gates: LaunchGates;
}

/** Некоректне/відсутнє значення — дефолт, а не 400: дашборд не має падати. */
export function windowDays(input?: number): number {
  if (input === undefined || !Number.isFinite(input)) return LAUNCH_WINDOW_DAYS;
  return Math.min(MAX_WINDOW_DAYS, Math.max(1, Math.trunc(input)));
}

@Injectable()
export class GetLaunchDashboard {
  constructor(@Inject(LAUNCH_METRICS_SOURCE) private readonly source: LaunchMetricsSource) {}

  async handle(input: { days?: number } = {}): Promise<LaunchDashboardView> {
    const days = windowDays(input.days);
    const to = new Date();
    const from = new Date(to.getTime() - days * DAY_MS);
    const counters = await this.source.countersBetween(from, to);
    return {
      range: { from: from.toISOString(), to: to.toISOString(), days },
      counters,
      gates: launchGates(counters),
    };
  }
}
