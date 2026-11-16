export interface DomainEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export * from './events/event-bus';

export * from './telemetry/index';
export * from './telemetry/compat';
