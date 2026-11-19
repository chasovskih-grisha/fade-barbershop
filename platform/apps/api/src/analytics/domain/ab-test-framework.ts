/** A/B Testing Framework (T-170/ABW-01).
 * Framework for testing waitlist configurations, UI variations,
 * and conversion funnels. Supports traffic splitting, variant tracking,
 * and result analysis.
 *
 * Usage:
 *   1. Define experiment with variants
 *   2. Assign clients to variants via hash-based deterministic routing
 *   3. Record events with variant ID
 *   4. Generate conversion reports
 */

import type { WaitlistEfficiencyMetrics, WaitlistEntryStatus } from './waitlist-efficiency-tracker';

/** Experiment identifier. */
export type ExperimentId = string;

/** Variant identifier within an experiment. */
export type VariantId = string;

/** Variant configuration for A/B testing. */
export interface ExperimentVariant {
  /** Unique variant identifier. */
  id: VariantId;
  /** Human-readable label for the variant. */
  label: string;
  /** Percentage of traffic allocated to this variant (0-100). */
  trafficPercent: number;
  /** Description of what this variant tests. */
  description: string;
}

/** A/B experiment configuration. */
export interface AExperiment {
  /** Unique experiment identifier. */
  id: ExperimentId;
  /** Experiment name/title. */
  name: string;
  /** Description of what is being tested. */
  description: string;
  /** List of variants with traffic allocation. */
  variants: ExperimentVariant[];
  /** Total traffic percentage must sum to 100. */
  totalTraffic: number;
  /** Whether experiment is active. */
  active: boolean;
  /** Date experiment started. */
  startedAt: Date;
  /** Date experiment ended (optional). */
  endedAt?: Date;
  /** Goal metric for the experiment (e.g. 'waitlist_conversion_rate'). */
  goalMetric: string;
}

/** Client experiment assignment - deterministic based on client ID hash. */
export interface ClientExperimentAssignment {
  /** Client ID. */
  clientId: string;
  /** Assigned experiment ID. */
  experimentId: ExperimentId;
  /** Assigned variant ID. */
  variantId: VariantId;
  /** Assignment timestamp. */
  assignedAt: Date;
  /** Whether the assignment is still active. */
  isActive: boolean;
}

/** Experiment result snapshot for reporting. */
export interface ExperimentResult {
  /** Experiment ID. */
  experimentId: ExperimentId;
  /** Variant ID. */
  variantId: VariantId;
  /** Number of clients assigned to this variant. */
  clientCount: number;
  /** Number of conversions (bookings from waitlist). */
  conversionCount: number;
  /** Conversion rate percentage. */
  conversionRatePercent: number;
  /** Average time from waitlist entry to booking (minutes). */
  avgTimeToBookingMinutes: number;
  /** Standard deviation of time to booking. */
  stdDevTimeToBookingMinutes: number;
  /** Start date of data collection. */
  dataStart: Date;
  /** End date of data collection. */
  dataEnd?: Date;
}

/** Assign a client to an experiment variant deterministically. */
export function assignClientToExperiment(
  clientId: string,
  experiments: readonly AExperiment[]
): ClientExperimentAssignment | null {
  // Hash client ID to determine experiment and variant
  const hash = simpleHash(clientId);

  // Find first active experiment that has remaining traffic
  for (const experiment of experiments) {
    if (!experiment.active) continue;

    // Determine which variant based on hash
    const variantIndex = hash % experiment.variants.length;
    const variant = experiment.variants[variantIndex];

    // Check traffic allocation
    const randomValue = Math.floor((hash % 10000) / 100); // 0-99
    let cumulativeTraffic = 0;

    for (const v of experiment.variants) {
      cumulativeTraffic += v.trafficPercent;
      if (randomValue < cumulativeTraffic) {
        return {
          clientId,
          experimentId: experiment.id,
          variantId: v.id,
          assignedAt: new Date(),
          isActive: true,
        };
      }
    }

    // Fallback to first variant
    return {
      clientId,
      experimentId: experiment.id,
      variantId: experiment.variants[0].id,
      assignedAt: new Date(),
      isActive: true,
    };
  }

  return null;
}

/** Simple hash function for deterministic experiment assignment. */
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/** Record an experiment assignment for a client. */
export function recordExperimentAssignment(
  assignment: ClientExperimentAssignment
): void {
  // In production: persist to database for analysis
  // For now: log or store in memory
  console.log(`Experiment assignment: ${assignment.clientId} → ${assignment.experimentId}/${assignment.variantId}`);
}

/** Record a conversion event for an experiment participant. */
export function recordExperimentConversion(
  clientId: string,
  experimentId: ExperimentId,
  variantId: VariantId,
  bookingValue: number,
  timestamp: Date
): void {
  // In production: persist to database for analytics
  // For now: log conversion
  console.log(`Experiment conversion: ${clientId} → ${experimentId}/${variantId} → $${bookingValue}`);
}

/** Generate experiment result report. */
export function generateExperimentResult(
  experiment: AExperiment,
  assignments: ClientExperimentAssignment[],
  conversions: { clientId: string; variantId: VariantId; value: number }[]
): ExperimentResult {
  const variantCounts = new Map<VariantId, number>();
  const variantConversions = new Map<VariantId, number>();
  const variantValues = new Map<VariantId, number[]>();

  // Initialize maps for all variants
  for (const variant of experiment.variants) {
    variantCounts.set(variant.id, 0);
    variantConversions.set(variant.id, 0);
    variantValues.set(variant.id, []);
  }

  // Count assignments and conversions
  for (const assignment of assignments) {
    if (assignment.experimentId === experiment.id) {
      variantCounts.set(assignment.variantId, (variantCounts.get(assignment.variantId) || 0) + 1);
    }
  }

  for (const conversion of conversions) {
    variantConversions.set(conversion.variantId, (variantConversions.get(conversion.variantId) || 0) + 1);
    variantValues.get(conversion.variantId)?.push(conversion.value);
  }

  // Calculate results
  const results: ExperimentResult = {
    experimentId: experiment.id,
    variantId: experiment.variants[0].id, // placeholder
    clientCount: assignments.length,
    conversionCount: 0,
    conversionRatePercent: 0,
    avgTimeToBookingMinutes: 0,
    stdDevTimeToBookingMinutes: 0,
    dataStart: experiment.startedAt,
    dataEnd: experiment.endedAt,
  };

  // Calculate per-variant metrics
  for (const variant of experiment.variants) {
    const count = variantCounts.get(variant.id) || 0;
    const conversionsCount = variantConversions.get(variant.id) || 0;
    const rate = count > 0 ? (conversionsCount / count) * 100 : 0;

    results.clientCount = assignments.filter(
      a => a.experimentId === experiment.id && variantCounts.get(a.variantId) === variantCounts.get(variant.id)
    ).length;

    results.variantId = variant.id; // last variant processed
    results.conversionCount = conversionsCount;
    results.conversionRatePercent = rate;

    const values = variantValues.get(variant.id) || [];
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      results.avgTimeToBookingMinutes = sum / values.length;
    }
  }

  return results;
}