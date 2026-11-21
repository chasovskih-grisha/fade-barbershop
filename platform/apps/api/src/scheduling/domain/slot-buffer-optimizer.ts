export interface SlotBufferContext {
  startTimeMinutes: number; // minutes from midnight
  durationMinutes: number;
  bufferMinutes: number;
}

export interface OptimizedSlotInterval {
  startMinutes: number;
  serviceEndMinutes: number;
  totalEndMinutes: number; // serviceEnd + bufferMinutes
  bufferMinutesApplied: number;
}

export class SlotBufferOptimizer {
  constructor(private readonly defaultBufferMinutes: number = 5) {}

  /**
   * Applies sanitation and transition buffer intervals to a sequence of slots or a single slot request.
   */
  optimizeInterval(context: SlotBufferContext): OptimizedSlotInterval {
    const buffer = Math.max(0, context.bufferMinutes ?? this.defaultBufferMinutes);
    const serviceEndMinutes = context.startTimeMinutes + Math.max(1, context.durationMinutes);
    const totalEndMinutes = serviceEndMinutes + buffer;

    return {
      startMinutes: context.startTimeMinutes,
      serviceEndMinutes,
      totalEndMinutes,
      bufferMinutesApplied: buffer,
    };
  }

  /**
   * Checks if two consecutive appointments with buffers conflict.
   */
  hasConflict(
    slotA: { startMinutes: number; durationMinutes: number; bufferMinutes?: number },
    slotB: { startMinutes: number; durationMinutes: number; bufferMinutes?: number }
  ): boolean {
    const optimizedA = this.optimizeInterval({
      startTimeMinutes: slotA.startMinutes,
      durationMinutes: slotA.durationMinutes,
      bufferMinutes: slotA.bufferMinutes ?? this.defaultBufferMinutes,
    });

    const optimizedB = this.optimizeInterval({
      startTimeMinutes: slotB.startMinutes,
      durationMinutes: slotB.durationMinutes,
      bufferMinutes: slotB.bufferMinutes ?? this.defaultBufferMinutes,
    });

    // Conflict occurs if optimizedA.totalEndMinutes > optimizedB.startMinutes && optimizedB.totalEndMinutes > optimizedA.startMinutes
    return (
      optimizedA.totalEndMinutes > optimizedB.startMinutes &&
      optimizedB.totalEndMinutes > optimizedA.startMinutes
    );
  }
}
