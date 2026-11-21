import { SlotBufferOptimizer } from './slot-buffer-optimizer';

describe('SlotBufferOptimizer (Booking Engine Optimization Specialist)', () => {
  let optimizer: SlotBufferOptimizer;

  beforeEach(() => {
    optimizer = new SlotBufferOptimizer(10); // 10 min default buffer
  });

  it('calculates service end and total end including buffer minutes', () => {
    const result = optimizer.optimizeInterval({
      startTimeMinutes: 600, // 10:00
      durationMinutes: 30, // 30 min haircut
      bufferMinutes: 10, // 10 min sanitation buffer
    });

    expect(result.startMinutes).toBe(600);
    expect(result.serviceEndMinutes).toBe(630); // 10:30
    expect(result.totalEndMinutes).toBe(640); // 10:40 including 10m buffer
    expect(result.bufferMinutesApplied).toBe(10);
  });

  it('uses default buffer if none specified', () => {
    const result = optimizer.optimizeInterval({
      startTimeMinutes: 600,
      durationMinutes: 30,
      bufferMinutes: undefined as any,
    });

    expect(result.totalEndMinutes).toBe(640); // 30 + 10 default
    expect(result.bufferMinutesApplied).toBe(10);
  });

  it('detects conflicts between overlapping or buffer-colliding slots', () => {
    // Slot A: 10:00 - 10:30 + 10m buffer -> ends at 10:40 (640m)
    // Slot B: 10:35 - 11:00 -> starts at 10:35 (635m), which is before 10:40!
    const conflict = optimizer.hasConflict(
      { startMinutes: 600, durationMinutes: 30, bufferMinutes: 10 },
      { startMinutes: 635, durationMinutes: 25, bufferMinutes: 5 }
    );

    expect(conflict).toBe(true);
  });

  it('reports no conflict when sufficient gap exists between slots', () => {
    // Slot A: 10:00 - 10:30 + 10m buffer -> ends at 10:40 (640m)
    // Slot B: 10:45 - 11:15 -> starts at 10:45 (645m), after 10:40
    const conflict = optimizer.hasConflict(
      { startMinutes: 600, durationMinutes: 30, bufferMinutes: 10 },
      { startMinutes: 645, durationMinutes: 30, bufferMinutes: 10 }
    );

    expect(conflict).toBe(false);
  });
});
