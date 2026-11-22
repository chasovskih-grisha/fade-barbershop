/** Disaster-recovery readiness and chaos-drill evaluation (T-5032). */

export interface RecoveryObjectives {
  /** Maximum acceptable data loss in seconds. */
  readonly rpoSeconds: number;
  /** Maximum acceptable time to restore service in seconds. */
  readonly rtoSeconds: number;
}

export interface ReplicaHealth {
  readonly region: string;
  readonly role: 'primary' | 'replica';
  readonly lagSeconds: number;
  readonly healthy: boolean;
}

export type ChaosScenario = 'region_outage' | 'latency_spike' | 'payment_gateway_timeout';

export const REQUIRED_CHAOS_SCENARIOS: readonly ChaosScenario[] = [
  'region_outage',
  'latency_spike',
  'payment_gateway_timeout',
];

export interface DrillResult {
  readonly scenario: ChaosScenario;
  readonly detectedWithinSeconds: number;
  readonly failedOverWithinSeconds: number;
  readonly dataLossSeconds: number;
  readonly recovered: boolean;
}

export interface DrillVerdict {
  readonly scenario: ChaosScenario;
  readonly passed: boolean;
  readonly reasons: readonly string[];
}

export interface DisasterRecoveryAssessment {
  readonly ready: boolean;
  readonly worstReplicaLagSeconds: number;
  readonly violations: readonly string[];
  readonly drills: readonly DrillVerdict[];
}

/** Replica lag and health must satisfy the RPO; at least one healthy replica is required. */
export function assessReplication(
  replicas: readonly ReplicaHealth[],
  objectives: RecoveryObjectives
): { ready: boolean; worstReplicaLagSeconds: number; violations: string[] } {
  const violations: string[] = [];
  const healthyReplicas = replicas.filter((replica) => replica.healthy && replica.role === 'replica');
  if (!replicas.some((replica) => replica.healthy && replica.role === 'primary')) {
    violations.push('primary_unhealthy');
  }
  if (healthyReplicas.length === 0) violations.push('no_healthy_replica');

  const worstReplicaLagSeconds = replicas
    .filter((replica) => replica.role === 'replica')
    .reduce((worst, replica) => Math.max(worst, replica.lagSeconds), 0);
  if (worstReplicaLagSeconds > objectives.rpoSeconds) violations.push('rpo_exceeded');

  return { ready: violations.length === 0, worstReplicaLagSeconds, violations };
}

function evaluateDrill(drill: DrillResult, objectives: RecoveryObjectives): DrillVerdict {
  const reasons: string[] = [];
  if (!drill.recovered) reasons.push('not_recovered');
  if (drill.dataLossSeconds > objectives.rpoSeconds) reasons.push('data_loss_exceeds_rpo');
  if (drill.failedOverWithinSeconds > objectives.rtoSeconds) reasons.push('failover_exceeds_rto');
  if (drill.detectedWithinSeconds > drill.failedOverWithinSeconds) {
    reasons.push('detection_slower_than_failover');
  }
  return { scenario: drill.scenario, passed: reasons.length === 0, reasons };
}

/**
 * Full go/no-go check: every required chaos scenario must be drilled and pass,
 * and replication must meet the RPO before the suite is considered ready.
 */
export function assessDisasterRecovery(input: {
  readonly objectives: RecoveryObjectives;
  readonly replicas: readonly ReplicaHealth[];
  readonly drills: readonly DrillResult[];
}): DisasterRecoveryAssessment {
  const replication = assessReplication(input.replicas, input.objectives);
  const missing = REQUIRED_CHAOS_SCENARIOS.filter(
    (scenario) => !input.drills.some((drill) => drill.scenario === scenario)
  );
  const drills = input.drills.map((drill) => evaluateDrill(drill, input.objectives));
  const violations = [
    ...replication.violations,
    ...missing.map((scenario) => `missing_drill:${scenario}`),
    ...drills.filter((drill) => !drill.passed).map((drill) => `failed_drill:${drill.scenario}`),
  ];
  return {
    ready: violations.length === 0,
    worstReplicaLagSeconds: replication.worstReplicaLagSeconds,
    violations,
    drills,
  };
}
