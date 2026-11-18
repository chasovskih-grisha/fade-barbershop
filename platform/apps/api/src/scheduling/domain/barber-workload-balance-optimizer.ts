export interface BarberShiftLoad {
  barberId: string;
  name: string;
  scheduledMinutes: number;
  maxCapacityMinutes: number;
  consecutiveBookedMinutes: number;
  breakMinutes: number;
}

export interface WorkloadBalanceRecommendation {
  barberId: string;
  name: string;
  utilizationRate: number;
  fatigueRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendedAction: string;
  suggestWalkInRedirection: boolean;
}

export interface WorkloadBalanceInput {
  barbers: BarberShiftLoad[];
  targetShiftMinutes?: number;
}

export interface WorkloadBalanceResult {
  recommendations: WorkloadBalanceRecommendation[];
  averageUtilization: number;
  loadImbalanceVariance: number;
  busiestBarberId: string;
  underutilizedBarberIds: string[];
}

/**
 * Optimizes workload distribution across barbers to prevent fatigue, burn-out,
 * and balance chair utilization evenly across the shop.
 */
export function optimizeBarberWorkloadBalance(input: WorkloadBalanceInput): WorkloadBalanceResult {
  const shiftMinutes = input.targetShiftMinutes ?? 480; // default 8-hour shift
  const recommendations: WorkloadBalanceRecommendation[] = [];
  let totalUtil = 0;

  const utilizations = input.barbers.map((b) => {
    const util = Math.min(1.0, b.scheduledMinutes / Math.max(1, b.maxCapacityMinutes || shiftMinutes));
    return { barberId: b.barberId, util };
  });

  for (const b of input.barbers) {
    const maxCap = b.maxCapacityMinutes || shiftMinutes;
    const util = Math.min(1.0, b.scheduledMinutes / Math.max(1, maxCap));
    totalUtil += util;

    let fatigueRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (b.consecutiveBookedMinutes >= 240 && b.breakMinutes < 30) {
      fatigueRiskLevel = 'critical';
    } else if (b.consecutiveBookedMinutes >= 180 || util >= 0.85) {
      fatigueRiskLevel = 'high';
    } else if (util >= 0.65) {
      fatigueRiskLevel = 'moderate';
    }

    let recommendedAction = 'Workload balanced';
    let suggestWalkInRedirection = false;

    if (fatigueRiskLevel === 'critical') {
      recommendedAction = 'Critical fatigue risk: Enforce mandatory 30-minute break and redirect incoming walk-ins to peers.';
      suggestWalkInRedirection = true;
    } else if (fatigueRiskLevel === 'high') {
      recommendedAction = 'High load: Monitor for continuous standing fatigue; schedule upcoming gap for station sanitization and rest.';
      suggestWalkInRedirection = true;
    } else if (util < 0.40) {
      recommendedAction = 'Underutilized chair: Priority recipient for incoming walk-ins and promotional quick-slots.';
      suggestWalkInRedirection = false;
    }

    recommendations.push({
      barberId: b.barberId,
      name: b.name,
      utilizationRate: Number(util.toFixed(2)),
      fatigueRiskLevel,
      recommendedAction,
      suggestWalkInRedirection,
    });
  }

  const averageUtilization = input.barbers.length > 0 ? Number((totalUtil / input.barbers.length).toFixed(2)) : 0;

  // Calculate variance for load imbalance
  const variance = input.barbers.length > 0
    ? input.barbers.reduce((acc, b) => {
        const util = b.scheduledMinutes / Math.max(1, b.maxCapacityMinutes || shiftMinutes);
        return acc + Math.pow(util - averageUtilization, 2);
      }, 0) / input.barbers.length
    : 0;

  const sortedByUtil = [...recommendations].sort((a, b) => b.utilizationRate - a.utilizationRate);
  const busiestBarberId = sortedByUtil.length > 0 && sortedByUtil[0] ? sortedByUtil[0].barberId : '';
  const underutilizedBarberIds = recommendations.filter((r) => r.utilizationRate < 0.50).map((r) => r.barberId);

  return {
    recommendations,
    averageUtilization,
    loadImbalanceVariance: Number(variance.toFixed(4)),
    busiestBarberId,
    underutilizedBarberIds,
  };
}
