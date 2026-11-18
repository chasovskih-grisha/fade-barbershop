import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RevenueOptimizationEngine, ClientSegment, SubscriptionPassRule } from '../domain/revenue-optimization';
import { RevenueYieldBooster } from '../domain/revenue-yield-booster';

@Controller('public/revenue-optimization')
export class RevenueOptimizationController {
  private readonly engine = new RevenueOptimizationEngine(
    {
      peakMultiplier: 1.15,
      offPeakMultiplier: 0.90,
      demandSurgeThreshold: 0.80,
      demandSurgeMultiplier: 1.10,
      holidayMultiplier: 1.25,
    },
    [
      {
        bundleName: 'Executive Grooming Combo',
        serviceIds: ['service-haircut', 'service-beard-trim'],
        discountPercentage: 15,
      },
    ]
  );

  @Get('quote')
  getDynamicPriceQuote(
    @Query('basePrice') basePrice: string,
    @Query('date') dateStr: string,
    @Query('locationId') locationId: string,
    @Query('utilizationRate') utilizationRate?: string,
    @Query('clientSegment') clientSegment?: string,
    @Query('isHoliday') isHoliday?: string
  ) {
    const base = parseFloat(basePrice) || 1000;
    const date = dateStr ? new Date(dateStr) : new Date();
    const util = utilizationRate ? parseFloat(utilizationRate) : undefined;
    const holiday = isHoliday === 'true';

    return this.engine.calculateDynamicPrice(base, {
      date,
      locationId: locationId || 'loc-default',
      ...(util !== undefined ? { utilizationRate: util } : {}),
      ...(clientSegment ? { clientSegment: clientSegment as ClientSegment } : {}),
      isHoliday: holiday,
    });
  }

  @Post('bundles')
  evaluateBundles(
    @Body() body: { selectedServiceIds: string[]; basePrices: Record<string, number> }
  ) {
    return this.engine.evaluateBundleDiscounts(body.selectedServiceIds || [], body.basePrices || {});
  }

  @Post('bundles/multi')
  evaluateMultiBundles(
    @Body() body: { selectedServiceIds: string[]; basePrices: Record<string, number> }
  ) {
    return this.engine.evaluateMultiBundleCombinations(body.selectedServiceIds || [], body.basePrices || {});
  }

  @Get('capacity-multiplier')
  capacityMultiplier(
    @Query('baseMultiplier') baseMultiplier: string,
    @Query('utilizationRate') utilizationRate: string
  ) {
    const base = parseFloat(baseMultiplier) || 1.15;
    const util = parseFloat(utilizationRate) || 0.85;
    return {
      baseMultiplier: base,
      utilizationRate: util,
      optimizedMultiplier: this.engine.calculateDynamicCapacityMultiplier(base, util),
    };
  }

  @Get('addons/:serviceId')
  getAddOns(@Param('serviceId') serviceId: string) {
    return this.engine.getAddOnRecommendations(serviceId);
  }

  @Post('addons/optimize')
  optimizeAddOns(
    @Body() body: { primaryServiceIds: string[]; minAffinityScore?: number; addonPrices?: Record<string, number> }
  ) {
    return this.engine.optimizeCartAddOns(
      body.primaryServiceIds || [],
      body.minAffinityScore ?? 0.70,
      body.addonPrices || {}
    );
  }

  @Post('addons/tiered-discount')
  tieredAddOnDiscount(
    @Body() body: { addOnCount: number; baseAddOnTotal: number; customTiers?: Record<number, number> }
  ) {
    return this.engine.calculateTieredCartAddOnDiscount(
      body.addOnCount ?? 0,
      body.baseAddOnTotal ?? 0,
      body.customTiers
    );
  }

  @Get('last-minute-yield')
  lastMinuteYield(
    @Query('basePrice') basePrice: string,
    @Query('slotStartTime') slotStartTime: string,
    @Query('utilizationRate') utilizationRate?: string
  ) {
    const base = parseFloat(basePrice) || 1000;
    const slot = slotStartTime ? new Date(slotStartTime) : new Date();
    const util = utilizationRate ? parseFloat(utilizationRate) : 0.30;
    return this.engine.calculateLastMinuteYieldPrice(base, slot, new Date(), util);
  }

  @Post('group-discount')
  groupBookingDiscount(
    @Body() body: { baseTotal: number; partySize: number; customRules?: { minPartySize: number; discountPercentage: number }[] }
  ) {
    return this.engine.calculateGroupBookingDiscount(
      body.baseTotal ?? 0,
      body.partySize ?? 1,
      body.customRules
    );
  }

  @Post('subscription-pass')
  subscriptionPassValue(
    @Body() body: { passRule: SubscriptionPassRule; expectedMonthlyUsage: { serviceId: string; basePrice: number; visits: number }[] }
  ) {
    return this.engine.calculateSubscriptionPassValue(
      body.passRule || { passName: 'VIP Pass', monthlyFee: 2500, includedVisitsPerMonth: 2, discountOnAdditionalServices: 15 },
      body.expectedMonthlyUsage || []
    );
  }

  @Get('barber-tier')
  barberTierPrice(
    @Query('basePrice') basePrice: string,
    @Query('tier') tier: string
  ) {
    const base = parseFloat(basePrice) || 1000;
    const barberTier = (tier || 'standard') as any;
    return this.engine.calculateBarberTierPrice(base, barberTier);
  }

  @Get('early-bird')
  earlyBirdPrice(
    @Query('basePrice') basePrice: string,
    @Query('slotTime') slotTimeStr: string
  ) {
    const base = parseFloat(basePrice) || 1000;
    const slotTime = slotTimeStr ? new Date(slotTimeStr) : new Date();
    return this.engine.calculateEarlyBirdPrice(base, slotTime);
  }

  @Post('seasonal-override')
  seasonalOverridePrice(
    @Body() body: { basePrice: number; bookingDate: string; rules?: { ruleName: string; fromDate: string; toDate: string; multiplier: number; reason: string }[] }
  ) {
    const base = body.basePrice ?? 1000;
    const date = body.bookingDate ? new Date(body.bookingDate) : new Date();
    const rules = body.rules?.map(r => ({
      ruleName: r.ruleName,
      fromDate: new Date(r.fromDate),
      toDate: new Date(r.toDate),
      multiplier: r.multiplier,
      reason: r.reason,
    }));
    return this.engine.calculateSeasonalOverridePrice(base, date, rules);
  }

  @Post('elasticity-simulation')
  elasticitySimulation(
    @Body() body: { basePrice: number; proposedPrice: number; baselineDailyBookings: number; elasticityCoefficient?: number }
  ) {
    return this.engine.calculateElasticityRevenueImpact(
      body.basePrice ?? 1000,
      body.proposedPrice ?? 1100,
      body.baselineDailyBookings ?? 20,
      body.elasticityCoefficient ?? -1.5
    );
  }

  @Post('smart-cart-incentive')
  smartCartIncentive(
    @Body() body: { cartItems: { itemId: string; basePrice: number; isAddOn: boolean; marginScore: number }[]; minAllowedMarginPercentage?: number }
  ) {
    const booster = new RevenueYieldBooster();
    return booster.calculateSmartCartAttachIncentive(
      body.cartItems || [],
      body.minAllowedMarginPercentage ?? 40
    );
  }
}
