export type ServiceType = 'fade' | 'beard' | 'full_service' | 'styling';
export type HairDensity = 'fine' | 'normal' | 'thick' | 'coarse';

export interface SanitationAppointmentItem {
  id: string;
  serviceType: ServiceType;
  clientHairDensity?: HairDensity;
  start: Date;
  end: Date;
}

export interface ChairSanitationInput {
  barberId: string;
  appointments: SanitationAppointmentItem[];
  baseSanitationMinutes?: number; // default 5 mins
}

export interface SanitationBottleneck {
  appointmentId: string;
  requiredMinutes: number;
  actualGapMinutes: number;
  deficitMinutes: number;
}

export interface ChairSanitationResult {
  barberId: string;
  totalAppointments: number;
  averageRequiredSanitationMinutes: number;
  averageActualGapMinutes: number;
  sanitationComplianceRate: number; // 0.0 to 1.0
  bottlenecks: SanitationBottleneck[];
  status: 'optimal' | 'moderate_risk' | 'high_congestion';
}

/**
 * Optimizes chair turnover and sanitization pacing between barber appointments.
 * Calculates sanitation requirements based on service complexity and hair density,
 * comparing required turnaround times against actual schedule gaps.
 */
export function optimizeChairSanitationPacing(input: ChairSanitationInput): ChairSanitationResult {
  const baseSanitation = input.baseSanitationMinutes ?? 5;
  const sorted = [...input.appointments].sort((a, b) => a.start.getTime() - b.start.getTime());

  let totalRequiredMinutes = 0;
  let totalActualGapMinutes = 0;
  let gapCount = 0;
  const bottlenecks: SanitationBottleneck[] = [];

  const getServiceMultiplier = (type: ServiceType): number => {
    switch (type) {
      case 'full_service': return 1.5;
      case 'fade': return 1.3;
      case 'beard': return 1.0;
      case 'styling': return 0.8;
      default: return 1.0;
    }
  };

  const getDensityMultiplier = (density?: HairDensity): number => {
    switch (density) {
      case 'coarse': return 1.4;
      case 'thick': return 1.2;
      case 'normal': return 1.0;
      case 'fine': return 0.9;
      default: return 1.0;
    }
  };

  const requiredSanitationFor = (item: SanitationAppointmentItem): number => {
    const raw = baseSanitation * getServiceMultiplier(item.serviceType) * getDensityMultiplier(item.clientHairDensity);
    return Math.round(raw);
  };

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current) continue;
    const req = requiredSanitationFor(current);
    totalRequiredMinutes += req;

    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev) {
        const gapMs = current.start.getTime() - prev.end.getTime();
        const gapMin = Math.max(0, Math.round(gapMs / 60000));
        totalActualGapMinutes += gapMin;
        gapCount++;

        if (gapMin < req) {
          bottlenecks.push({
            appointmentId: current.id,
            requiredMinutes: req,
            actualGapMinutes: gapMin,
            deficitMinutes: req - gapMin,
          });
        }
      }
    }
  }

  const count = sorted.length;
  const avgReq = count > 0 ? Math.round((totalRequiredMinutes / count) * 10) / 10 : 0;
  const avgGap = gapCount > 0 ? Math.round((totalActualGapMinutes / gapCount) * 10) / 10 : baseSanitation;

  let complianceRate = 1.0;
  if (count > 1) {
    const compliantCount = (count - 1) - bottlenecks.length;
    complianceRate = Math.max(0, Math.round((compliantCount / (count - 1)) * 100) / 100);
  }

  let status: 'optimal' | 'moderate_risk' | 'high_congestion' = 'optimal';
  if (complianceRate < 0.6 || bottlenecks.length >= 3) {
    status = 'high_congestion';
  } else if (complianceRate < 0.85 || bottlenecks.length > 0) {
    status = 'moderate_risk';
  }

  return {
    barberId: input.barberId,
    totalAppointments: count,
    averageRequiredSanitationMinutes: avgReq,
    averageActualGapMinutes: avgGap,
    sanitationComplianceRate: complianceRate,
    bottlenecks,
    status,
  };
}
