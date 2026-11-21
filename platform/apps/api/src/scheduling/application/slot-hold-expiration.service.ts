import { kyivStamp } from './kyiv-stamp';

export interface SlotHoldConfig {
  holdDurationMinutes: number; // default 10 minutes
}

export const DEFAULT_SLOT_HOLD_CONFIG: SlotHoldConfig = {
  holdDurationMinutes: 10,
};

export interface SlotHoldInput {
  slotStart: Date;
  heldAt: Date;
  currentTime: Date;
  timeZone?: string;
}

export interface SlotHoldResult {
  isExpired: boolean;
  remainingSeconds: number;
  kyivStart: { date: string; time: string };
}

export class SlotHoldExpirationService {
  constructor(private config: SlotHoldConfig = DEFAULT_SLOT_HOLD_CONFIG) {}

  assessHold(input: SlotHoldInput): SlotHoldResult {
    const timeZone = input.timeZone ?? 'Europe/Kyiv';
    const kyivStart = kyivStamp(input.slotStart, timeZone);

    const elapsedMs = input.currentTime.getTime() - input.heldAt.getTime();
    const holdLimitMs = this.config.holdDurationMinutes * 60 * 1000;
    const remainingMs = holdLimitMs - elapsedMs;

    const isExpired = remainingMs <= 0;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    return {
      isExpired,
      remainingSeconds,
      kyivStart,
    };
  }
}
