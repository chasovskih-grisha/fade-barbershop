export interface SlotLockOptions {
  ttlMs?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

export interface SlotLockResult {
  acquired: boolean;
  lockKey: string;
  token: string;
}

export interface AcquireLockInput {
  barberId: string;
  date: string;
  slotTime: string;
  options?: SlotLockOptions;
}

export interface TwoChairInvariantInput {
  barberId: string;
  date: string;
  slotTime: string;
  currentActiveBookingsCount: number;
}

export interface TwoChairInvariantResult {
  allowed: boolean;
  reason?: string;
}
