import { optimizeMultiLocationRouting } from './multi-location-slot-routing-optimizer';

describe('MultiLocationSlotRoutingOptimizer', () => {
  it('should prioritize preferred location when slots are available', () => {
    const result = optimizeMultiLocationRouting({
      requestedLocationId: 'loc-1',
      maxAcceptableDistanceKm: 15,
      allowCrossLocationFallback: true,
      serviceBasePrice: 1000,
      locations: [
        {
          locationId: 'loc-1',
          locationName: 'FADE Downtown',
          distanceKm: 2.0,
          currentSeatOccupancyRate: 0.4,
          availableSlotsCount: 5,
          isPreferredLocation: true,
        },
        {
          locationId: 'loc-2',
          locationName: 'FADE Uptown',
          distanceKm: 8.0,
          currentSeatOccupancyRate: 0.2,
          availableSlotsCount: 8,
          isPreferredLocation: false,
          offPeakDiscountPercent: 10,
        },
      ],
    });

    expect(result.primaryRecommendation.recommendedLocationId).toBe('loc-1');
    expect(result.primaryRecommendation.routingTier).toBe('PREFERRED');
    expect(result.fallbackTriggered).toBe(false);
    expect(result.alternativeRecommendations.length).toBe(1);
    expect(result.alternativeRecommendations[0]?.recommendedLocationId).toBe('loc-2');
  });

  it('should route to alternative location with off-peak savings when requested location is full', () => {
    const result = optimizeMultiLocationRouting({
      requestedLocationId: 'loc-1',
      maxAcceptableDistanceKm: 15,
      allowCrossLocationFallback: true,
      serviceBasePrice: 1000,
      locations: [
        {
          locationId: 'loc-1',
          locationName: 'FADE Downtown',
          distanceKm: 1.5,
          currentSeatOccupancyRate: 1.0,
          availableSlotsCount: 0,
          isPreferredLocation: true,
        },
        {
          locationId: 'loc-2',
          locationName: 'FADE Uptown',
          distanceKm: 5.0,
          currentSeatOccupancyRate: 0.3,
          availableSlotsCount: 6,
          isPreferredLocation: false,
          offPeakDiscountPercent: 15,
        },
      ],
    });

    expect(result.primaryRecommendation.recommendedLocationId).toBe('loc-2');
    expect(result.primaryRecommendation.routingTier).toBe('OFF_PEAK_SAVINGS');
    expect(result.primaryRecommendation.adjustedPrice).toBe(850);
    expect(result.primaryRecommendation.savingsAmount).toBe(150);
    expect(result.fallbackTriggered).toBe(true);
  });
});
