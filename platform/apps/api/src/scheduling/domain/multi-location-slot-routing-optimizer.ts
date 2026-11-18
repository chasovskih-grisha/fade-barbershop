export interface LocationCandidate {
  locationId: string;
  locationName: string;
  distanceKm: number;
  currentSeatOccupancyRate: number; // 0.0 to 1.0
  availableSlotsCount: number;
  isPreferredLocation: boolean;
  offPeakDiscountPercent?: number;
}

export interface RoutingContext {
  requestedLocationId: string;
  maxAcceptableDistanceKm: number;
  allowCrossLocationFallback: boolean;
  locations: LocationCandidate[];
  serviceBasePrice: number;
}

export interface RoutedSlotRecommendation {
  recommendedLocationId: string;
  recommendedLocationName: string;
  routingTier: 'PREFERRED' | 'NEARBY_ALTERNATIVE' | 'OFF_PEAK_SAVINGS' | 'CONGESTED_FALLBACK';
  distanceKm: number;
  adjustedPrice: number;
  savingsAmount: number;
  routingScore: number; // 0.0 to 1.0 (higher is better)
  reason: string;
}

export interface MultiLocationRoutingResult {
  primaryRecommendation: RoutedSlotRecommendation;
  alternativeRecommendations: RoutedSlotRecommendation[];
  fallbackTriggered: boolean;
}

/**
 * Optimizes slot routing and load balancing across multiple FADE salon locations.
 */
export function optimizeMultiLocationRouting(
  context: RoutingContext
): MultiLocationRoutingResult {
  const {
    requestedLocationId,
    maxAcceptableDistanceKm,
    locations,
    serviceBasePrice,
  } = context;

  const scoredLocations: { candidate: LocationCandidate; score: number; tier: RoutedSlotRecommendation['routingTier'] }[] = [];

  for (const loc of locations) {
    if (loc.distanceKm > maxAcceptableDistanceKm && !loc.isPreferredLocation) {
      continue;
    }

    if (loc.availableSlotsCount <= 0 && !loc.isPreferredLocation) {
      continue;
    }

    // Distance penalty (normalized up to maxAcceptableDistanceKm)
    const distancePenalty = Math.min(1.0, loc.distanceKm / Math.max(1, maxAcceptableDistanceKm));
    // Congestion penalty (high occupancy reduces score)
    const congestionPenalty = loc.currentSeatOccupancyRate;
    // Availability bonus (more available slots increase score)
    const availabilityBonus = Math.min(1.0, loc.availableSlotsCount / 10);

    let baseScore = 1.0 - (distancePenalty * 0.3) - (congestionPenalty * 0.4) + (availabilityBonus * 0.3);

    let tier: RoutedSlotRecommendation['routingTier'] = 'NEARBY_ALTERNATIVE';

    if (loc.locationId === requestedLocationId) {
      if (loc.availableSlotsCount > 0) {
        tier = 'PREFERRED';
        baseScore += 0.3; // Preferred location bonus
      } else {
        tier = 'CONGESTED_FALLBACK';
        baseScore -= 0.5; // Congested requested location penalty
      }
    } else if (loc.offPeakDiscountPercent && loc.offPeakDiscountPercent > 0) {
      tier = 'OFF_PEAK_SAVINGS';
      baseScore += 0.15; // Off-peak incentive bonus
    }

    const finalScore = Number(Math.max(0.05, Math.min(1.0, baseScore)).toFixed(4));
    scoredLocations.push({ candidate: loc, score: finalScore, tier });
  }

  // Sort by score descending
  scoredLocations.sort((a, b) => b.score - a.score);

  if (scoredLocations.length === 0 || locations.length === 0) {
    // Fallback to requested location even if 0 slots if no alternatives found
    const requestedLoc = locations.find((l) => l.locationId === requestedLocationId) || locations[0] || {
      locationId: requestedLocationId || 'default-location',
      locationName: 'FADE Flagship Salon',
      distanceKm: 0,
      currentSeatOccupancyRate: 1.0,
      availableSlotsCount: 0,
      isPreferredLocation: true,
    };
    const fallbackRec: RoutedSlotRecommendation = {
      recommendedLocationId: requestedLoc.locationId,
      recommendedLocationName: requestedLoc.locationName,
      routingTier: 'CONGESTED_FALLBACK',
      distanceKm: requestedLoc.distanceKm,
      adjustedPrice: serviceBasePrice,
      savingsAmount: 0,
      routingScore: 0.1,
      reason: 'Requested location is fully booked. Fallback engaged with waitlist prioritization.',
    };
    return {
      primaryRecommendation: fallbackRec,
      alternativeRecommendations: [],
      fallbackTriggered: true,
    };
  }

  const recommendations: RoutedSlotRecommendation[] = scoredLocations.map(({ candidate, score, tier }) => {
    const discount = candidate.offPeakDiscountPercent || 0;
    const savingsAmount = Number((serviceBasePrice * (discount / 100)).toFixed(2));
    const adjustedPrice = Number((serviceBasePrice - savingsAmount).toFixed(2));

    let reason = '';
    if (tier === 'PREFERRED') {
      reason = `Selected requested location "${candidate.locationName}" with optimal slot availability (${candidate.availableSlotsCount} slots).`;
    } else if (tier === 'OFF_PEAK_SAVINGS') {
      reason = `Alternative location "${candidate.locationName}" offers an off-peak discount of ${discount}% (${savingsAmount} currency units saved) at ${candidate.distanceKm}km distance.`;
    } else if (tier === 'CONGESTED_FALLBACK') {
      reason = `Requested location is congested. Recommended routing to nearby "${candidate.locationName}" (${candidate.distanceKm}km) for immediate slot availability.`;
    } else {
      reason = `Nearby alternative location "${candidate.locationName}" available at ${candidate.distanceKm}km with ${candidate.availableSlotsCount} open slots.`;
    }

    return {
      recommendedLocationId: candidate.locationId,
      recommendedLocationName: candidate.locationName,
      routingTier: tier,
      distanceKm: candidate.distanceKm,
      adjustedPrice,
      savingsAmount,
      routingScore: score,
      reason,
    };
  });

  const primary: RoutedSlotRecommendation = recommendations[0] || {
    recommendedLocationId: requestedLocationId,
    recommendedLocationName: 'FADE Flagship Salon',
    routingTier: 'CONGESTED_FALLBACK',
    distanceKm: 0,
    adjustedPrice: serviceBasePrice,
    savingsAmount: 0,
    routingScore: 0.1,
    reason: 'Default routing fallback engaged.',
  };
  const alternatives = recommendations.slice(1);
  const fallbackTriggered = primary.recommendedLocationId !== requestedLocationId || primary.routingTier === 'CONGESTED_FALLBACK';

  return {
    primaryRecommendation: primary,
    alternativeRecommendations: alternatives,
    fallbackTriggered,
  };
}
