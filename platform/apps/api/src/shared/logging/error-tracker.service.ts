/* eslint-disable max-params -- 1 signature whose 4-param contract is fixed by existing call sites (worst: recordError, limit 3); API redesign tracked in T-2500f */
import { Injectable } from '@nestjs/common';

export interface ErrorRecord {
  timestamp: string;
  context: string;
  message: string;
  stack?: string | undefined;
  statusCode?: number | undefined;
}

@Injectable()
export class ErrorTrackerService {
  private readonly errors: ErrorRecord[] = [];
  private readonly maxCapacity = 100;

  recordError(context: string, message: string, stack?: string, statusCode?: number): void {
    try {
      const record: ErrorRecord = {
        timestamp: new Date().toISOString(),
        context,
        message,
        stack,
        statusCode,
      };
      this.errors.unshift(record);
      if (this.errors.length > this.maxCapacity) {
        this.errors.pop();
      }
    } catch {
      // Non-blocking telemetry
    }
  }

  snapshot(): { totalRecorded: number; recentErrors: ErrorRecord[] } {
    return {
      totalRecorded: this.errors.length,
      recentErrors: [...this.errors].slice(0, 20),
    };
  }

  clear(): void {
    this.errors.length = 0;
  }
}
