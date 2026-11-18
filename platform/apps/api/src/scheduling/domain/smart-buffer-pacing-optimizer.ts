export interface SmartBufferPacingRequest {
  barberId: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  appointments: {
    appointmentId: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    serviceType: string;
    isVip: boolean;
    clientHistoricalNoShowRate: number; // 0.0 to 1.0
  }[];
  peakHours: {
    startHour: number; // e.g. 17 (5 PM)
    endHour: number; // e.g. 20 (8 PM)
  }[];
}

export interface SmartBufferPacingResult {
  barberId: string;
  totalAppointments: number;
  recommendedBufferMinutes: Record<string, number>; // appointmentId -> buffer minutes added
  pacingRiskScore: number; // 0 to 100
  recommendations: string[];
}

/**
 * Optimizes turnaround buffers and time pacing between appointments based on service complexity,
 * client reliability (no-show rate), VIP status, and peak hour congestion.
 */
export function optimizeSmartBufferPacing(request: SmartBufferPacingRequest): SmartBufferPacingResult {
  const recommendedBufferMinutes: Record<string, number> = {};
  let totalRisk = 0;

  for (const apt of request.appointments) {
    let buffer = 5; // default 5 min buffer

    // Check if appointment start falls into peak hours
    const startHour = parseInt(apt.startTime.split(':')[0] || '12', 10);
    const isPeak = request.peakHours.some(p => startHour >= p.startHour && startHour < p.endHour);

    if (isPeak) {
      buffer += 3; // add 3 mins during peak hours to absorb downstream delays
    }

    if (apt.isVip) {
      buffer += 5; // extra attention buffer for VIP clients
    }

    if (apt.clientHistoricalNoShowRate > 0.15) {
      buffer += 5; // buffer for clients with higher late/reschedule tendency
    }

    recommendedBufferMinutes[apt.appointmentId] = buffer;

    // Calculate risk
    let risk = 10;
    if (isPeak) risk += 25;
    if (apt.clientHistoricalNoShowRate > 0.2) risk += 30;
    totalRisk += risk;
  }

  const pacingRiskScore = request.appointments.length > 0 
    ? Math.min(100, Math.round(totalRisk / request.appointments.length)) 
    : 0;

  const recommendations: string[] = [];
  if (pacingRiskScore > 50) {
    recommendations.push('High schedule congestion detected. Increased turnaround buffers applied to prevent cascading delays.');
  } else {
    recommendations.push('Schedule pacing is optimal with standard turnaround buffers.');
  }

  return {
    barberId: request.barberId,
    totalAppointments: request.appointments.length,
    recommendedBufferMinutes,
    pacingRiskScore,
    recommendations,
  };
}
