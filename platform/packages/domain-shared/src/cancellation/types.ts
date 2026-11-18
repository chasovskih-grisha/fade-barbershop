export enum CancellationReason {
  CLIENT_REQUEST = 'CLIENT_REQUEST',
  CLIENT_SICK = 'CLIENT_SICK',
  CLIENT_SCHEDULE = 'CLIENT_SCHEDULE',
  BARBER_SICK = 'BARBER_SICK',
  BARBER_VACATION = 'BARBER_VACATION',
  SALON_CLOSED = 'SALON_CLOSED',
  WEATHER = 'WEATHER',
  OTHER = 'OTHER',
}

export enum NoShowReason {
  CLIENT_NO_SHOW = 'CLIENT_NO_SHOW',
  CLIENT_LATE = 'CLIENT_LATE',
  WRONG_TIME = 'WRONG_TIME',
  OTHER = 'OTHER',
}

export interface CancellationPolicyConfig {
  locationId: string;
  serviceId?: string;
  freeCancelHours: number;
  depositForHighRisk: boolean;
  highRiskThreshold: number; // e.g. 3 no-shows in 90 days
  vipDepositWaiver?: boolean;
}

export interface ClientNoShowRecord {
  clientId: string;
  noShowCount90d: number;
  cancellationCount90d: number;
  isHighRisk: boolean;
  requiresFullDeposit: boolean;
  blockOnlineBooking: boolean;
  isExcused?: boolean;
}
