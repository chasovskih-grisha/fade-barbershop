import {
  assessDisasterRecovery,
  assessReplication,
  type DrillResult,
  type ReplicaHealth,
} from './disaster-recovery';

const objectives = { rpoSeconds: 5, rtoSeconds: 30 };

const replicas: ReplicaHealth[] = [
  { region: 'eu-west-1', role: 'primary', lagSeconds: 0, healthy: true },
  { region: 'eu-central-1', role: 'replica', lagSeconds: 2, healthy: true },
];

const passingDrills: DrillResult[] = [
  { scenario: 'region_outage', detectedWithinSeconds: 5, failedOverWithinSeconds: 20, dataLossSeconds: 1, recovered: true },
  { scenario: 'latency_spike', detectedWithinSeconds: 3, failedOverWithinSeconds: 10, dataLossSeconds: 0, recovered: true },
  { scenario: 'payment_gateway_timeout', detectedWithinSeconds: 2, failedOverWithinSeconds: 15, dataLossSeconds: 0, recovered: true },
];

describe('disaster recovery readiness (T-5032)', () => {
  it('passes when replicas meet the RPO and all drills pass', () => {
    const assessment = assessDisasterRecovery({ objectives, replicas, drills: passingDrills });
    expect(assessment.ready).toBe(true);
    expect(assessment.violations).toEqual([]);
    expect(assessment.worstReplicaLagSeconds).toBe(2);
    expect(assessment.drills.every((drill) => drill.passed)).toBe(true);
  });

  it('reports an unhealthy primary and a missing replica', () => {
    expect(
      assessReplication(
        [
          { region: 'eu-west-1', role: 'primary', lagSeconds: 0, healthy: false },
          { region: 'eu-central-1', role: 'replica', lagSeconds: 1, healthy: false },
        ],
        objectives
      )
    ).toEqual({
      ready: false,
      worstReplicaLagSeconds: 1,
      violations: ['primary_unhealthy', 'no_healthy_replica'],
    });
  });

  it('fails the RPO when replica lag exceeds the objective', () => {
    const result = assessReplication(
      [replicas[0] as ReplicaHealth, { region: 'eu-central-1', role: 'replica', lagSeconds: 12, healthy: true }],
      objectives
    );
    expect(result.ready).toBe(false);
    expect(result.violations).toEqual(['rpo_exceeded']);
    expect(result.worstReplicaLagSeconds).toBe(12);
  });

  it('lists missing required chaos scenarios', () => {
    const assessment = assessDisasterRecovery({
      objectives,
      replicas,
      drills: passingDrills.filter((drill) => drill.scenario === 'region_outage'),
    });
    expect(assessment.ready).toBe(false);
    expect(assessment.violations).toEqual([
      'missing_drill:latency_spike',
      'missing_drill:payment_gateway_timeout',
    ]);
  });

  it('fails drills that break the RTO or lose too much data', () => {
    const drills: DrillResult[] = [
      { scenario: 'region_outage', detectedWithinSeconds: 50, failedOverWithinSeconds: 45, dataLossSeconds: 9, recovered: false },
      ...passingDrills.slice(1),
    ];
    const assessment = assessDisasterRecovery({ objectives, replicas, drills });
    expect(assessment.ready).toBe(false);
    expect(assessment.drills[0]).toEqual({
      scenario: 'region_outage',
      passed: false,
      reasons: ['not_recovered', 'data_loss_exceeds_rpo', 'failover_exceeds_rto', 'detection_slower_than_failover'],
    });
    expect(assessment.violations).toContain('failed_drill:region_outage');
  });
});
