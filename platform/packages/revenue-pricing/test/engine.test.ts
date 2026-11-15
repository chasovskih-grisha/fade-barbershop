import { RevenuePricingEngine, ServiceItem, BundlePackage, AddOnRecommendation, PricingEngineConfig } from '../src/index';

describe('RevenuePricingEngine', () => {
  const config: PricingEngineConfig = {
    peakRules: [
      { dayOfWeek: 5, startHour: 15, endHour: 20, multiplier: 1.2 }, // Friday 3pm-8pm: +20%
      { dayOfWeek: 6, startHour: 10, endHour: 18, multiplier: 1.25 } // Saturday 10am-6pm: +25%
    ],
    bundles: [
      {
        id: 'gentlemans-combo',
        name: "Gentleman's Full Grooming",
        description: 'Haircut + Beard Trim + Facial',
        services: ['haircut', 'beard', 'facial'],
        discountPercentage: 15,
        featured: true
      }
    ],
    addOns: [
      { addOnId: 'hot-towel', name: 'Hot Towel Treatment', price: 15, attachProbability: 0.6, category: 'spa' },
      { addOnId: 'scalp-massage', name: 'Relaxing Scalp Massage', price: 20, attachProbability: 0.4, category: 'spa' },
      { addOnId: 'beard-oil', name: 'Premium Beard Oil Application', price: 10, attachProbability: 0.75, category: 'grooming' }
    ]
  };

  const engine = new RevenuePricingEngine(config);

  test('calculates dynamic pricing correctly during peak vs off-peak', () => {
    // Friday at 17:00 (5 PM) -> Peak (multiplier 1.2)
    const fridayPeak = new Date('2026-11-20T17:00:00'); // Nov 20, 2026 is Friday
    const res1 = engine.calculateDynamicPrice(50, fridayPeak);
    expect(res1.isPeak).toBe(true);
    expect(res1.multiplier).toBe(1.2);
    expect(res1.finalPrice).toBe(60);

    // Thursday at 14:00 (2 PM) -> Off-peak (multiplier 1.0)
    const thursdayOffPeak = new Date('2026-11-19T14:00:00'); // Thursday
    const res2 = engine.calculateDynamicPrice(50, thursdayOffPeak);
    expect(res2.isPeak).toBe(false);
    expect(res2.multiplier).toBe(1.0);
    expect(res2.finalPrice).toBe(50);
  });

  test('evaluates bundle savings correctly', () => {
    const servicesMap = new Map<string, ServiceItem>([
      ['haircut', { id: 'haircut', name: 'Haircut', basePrice: 40, durationMinutes: 30, category: 'haircut' }],
      ['beard', { id: 'beard', name: 'Beard Trim', basePrice: 25, durationMinutes: 20, category: 'beard' }],
      ['facial', { id: 'facial', name: 'Express Facial', basePrice: 35, durationMinutes: 25, category: 'treatment' }]
    ]);

    const evaluation = engine.evaluateBundle('gentlemans-combo', servicesMap);
    expect(evaluation).not.toBeNull();
    expect(evaluation?.totalIndividualPrice).toBe(100);
    expect(evaluation?.bundlePrice).toBe(85); // 15% off 100
    expect(evaluation?.savings).toBe(15);
  });

  test('returns top add-on recommendations sorted by revenue potential', () => {
    const topAddOns = engine.getTopAddOnRecommendations(2);
    expect(topAddOns.length).toBe(2);
    // beard-oil: 10 * 0.75 = 7.5
    // hot-towel: 15 * 0.6 = 9.0
    // scalp-massage: 20 * 0.4 = 8.0
    // Expected order by revenue potential: hot-towel (9.0), scalp-massage (8.0) or beard-oil (7.5)
    expect(topAddOns[0].addOnId).toBe('hot-towel');
    expect(topAddOns[1].addOnId).toBe('scalp-massage');
  });

  test('calculates correct cart total with dynamic pricing and bundle savings', () => {
    const servicesMap = new Map<string, ServiceItem>([
      ['haircut', { id: 'haircut', name: 'Haircut', basePrice: 40, durationMinutes: 30, category: 'haircut' }],
      ['beard', { id: 'beard', name: 'Beard Trim', basePrice: 25, durationMinutes: 20, category: 'beard' }],
      ['facial', { id: 'facial', name: 'Express Facial', basePrice: 35, durationMinutes: 25, category: 'treatment' }]
    ]);

    const addOnsMap = new Map<string, AddOnRecommendation>([
      ['hot-towel', { addOnId: 'hot-towel', name: 'Hot Towel Treatment', price: 15, attachProbability: 0.6, category: 'spa' }]
    ]);

    // Saturday at 12:00 -> Peak multiplier 1.25
    const saturdayPeak = new Date('2026-11-21T12:00:00');
    const cart = engine.calculateCartTotal(
      ['haircut', 'beard', 'facial'],
      ['hot-towel'],
      saturdayPeak,
      servicesMap,
      addOnsMap
    );

    expect(cart.subtotal).toBe(100);
    // Dynamic total for individual services: (40+25+35) * 1.25 = 100 * 1.25 = 125
    expect(cart.dynamicTotal).toBe(125);
    // Bundle savings on base sum 100 is 15 -> applied savings 15
    expect(cart.appliedSavings).toBe(15);
    expect(cart.addOnsTotal).toBe(15);
    // Final total = 125 - 15 + 15 = 125
    expect(cart.finalTotal).toBe(125);
  });
});
