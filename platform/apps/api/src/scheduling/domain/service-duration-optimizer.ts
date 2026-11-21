/**
 * FADE Service Duration & Buffer Optimization Engine
 * Dynamically adjusts service duration and sanitization/cleanup buffer times
 * based on barber pacing performance, client hair density, and consultation needs.
 */

export type HairDensity = 'fine' | 'normal' | 'thick' | 'coarse';

export interface ServiceDurationContext {
  baseServiceDurationMinutes: number;
  baseBufferMinutes: number;
  barberPacingFactor?: number; // e.g. 0.90 for fast barber, 1.10 for meticulous barber
  hairDensity?: HairDensity;
  isFirstVisit?: boolean;
}

export interface OptimizedServiceDurationResult {
  optimizedServiceDurationMinutes: number;
  optimizedBufferMinutes: number;
  totalSlotDurationMinutes: number;
  pacingMultiplier: number;
  densityMultiplier: number;
  consultationBufferAddedMinutes: number;
}

export class ServiceDurationOptimizationEngine {
  private readonly defaultPacingFactor: number;
  private readonly densityMultipliers: Record<HairDensity, number>;

  constructor(defaultPacingFactor: number = 1.0) {
    this.defaultPacingFactor = defaultPacingFactor;
    this.densityMultipliers = {
      fine: 0.9,
      normal: 1.0,
      thick: 1.15,
      coarse: 1.25,
    };
  }

  /**
   * Computes optimized service duration and buffer time for booking slot allocation.
   */
  optimizeDuration(context: ServiceDurationContext): OptimizedServiceDurationResult {
    const pacingMultiplier = context.barberPacingFactor ?? this.defaultPacingFactor;
    const density = context.hairDensity ?? 'normal';
    const densityMultiplier = this.densityMultipliers[density] ?? 1.0;

    // Calculate raw service duration adjusted for barber efficiency & hair complexity
    const rawServiceDuration =
      context.baseServiceDurationMinutes * pacingMultiplier * densityMultiplier;
    const optimizedServiceDurationMinutes = Math.max(15, Math.round(rawServiceDuration / 5) * 5); // round to nearest 5 min, min 15 mins

    // First-time visit adds 5 minutes consultation buffer
    const consultationBufferAddedMinutes = context.isFirstVisit ? 5 : 0;

    // Buffer (cleanup/sanitization) adjusts slightly with duration and pacing
    const rawBuffer =
      (context.baseBufferMinutes + consultationBufferAddedMinutes) *
      Math.min(1.2, Math.max(0.8, pacingMultiplier));
    const optimizedBufferMinutes = Math.max(5, Math.round(rawBuffer / 5) * 5); // round to nearest 5 min, min 5 mins

    const totalSlotDurationMinutes = optimizedServiceDurationMinutes + optimizedBufferMinutes;

    return {
      optimizedServiceDurationMinutes,
      optimizedBufferMinutes,
      totalSlotDurationMinutes,
      pacingMultiplier,
      densityMultiplier,
      consultationBufferAddedMinutes,
    };
  }
}
