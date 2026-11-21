export interface SmartGracePeriodRequest {
  barberId: string;
  locationId: string;
  appointmentId: string;
  scheduledStartTime: string; // HH:mm
  scheduledEndTime: string; // HH:mm
  serviceDurationMinutes: number;
  clientNoShowRate: number; // 0.0 to 1.0
  clientVipStatus: boolean;
  currentStudioQueueLoadPercentage: number; // 0 to 100
}

export interface SmartGracePeriodResult {
  appointmentId: string;
  barberId: string;
  baseGraceMinutes: number;
  recommendedGraceMinutes: number;
  autoExtensionAllowed: boolean;
  extensionReasoning: string[];
}

/**
 * Optimizes appointment slot grace periods and determines auto-extension eligibility
 * based on client reliability, VIP status, service complexity, and current studio congestion.
 */
export function optimizeSmartGracePeriod(request: SmartGracePeriodRequest): SmartGracePeriodResult {
  let graceMinutes = 10; // Standard base grace period
  const reasoning: string[] = ['Base grace period set to 10 minutes.'];

  // VIP bonus
  if (request.clientVipStatus) {
    graceMinutes += 5;
    reasoning.push('VIP status bonus applied (+5 min).');
  }

  // Client historical reliability bonus (low no-show rate <= 5%)
  if (request.clientNoShowRate <= 0.05) {
    graceMinutes += 3;
    reasoning.push('High historical reliability bonus applied (+3 min).');
  } else if (request.clientNoShowRate > 0.2) {
    graceMinutes -= 5;
    reasoning.push('Elevated historical no-show rate penalty applied (-5 min).');
  }

  // Studio queue congestion adjustment
  let autoExtensionAllowed = true;
  if (request.currentStudioQueueLoadPercentage > 85) {
    if (!request.clientVipStatus) {
      graceMinutes -= 4;
      autoExtensionAllowed = false;
      reasoning.push(
        'High studio congestion (>85%) restricted grace period and disabled auto-extension for non-VIP.'
      );
    } else {
      reasoning.push(
        'High studio congestion (>85%), but VIP status preserved auto-extension capability.'
      );
    }
  } else {
    reasoning.push(
      'Studio queue load is within normal operating parameters; auto-extension enabled.'
    );
  }

  // Clamp grace period between 5 and 25 minutes
  const finalGraceMinutes = Math.max(5, Math.min(25, graceMinutes));

  return {
    appointmentId: request.appointmentId,
    barberId: request.barberId,
    baseGraceMinutes: 10,
    recommendedGraceMinutes: finalGraceMinutes,
    autoExtensionAllowed,
    extensionReasoning: reasoning,
  };
}
