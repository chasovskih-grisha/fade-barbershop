const { RevenuePricingEngine } = require('../src/index');

describe('RevenuePricingEngine', () => {
  const config = {
    peakRules: [
      { dayOfWeek: 5, startHour: 15, endHour: 20, multiplier: 1.2 },
      { dayOfWeek: 6, startHour: 10, endHour: 18, multiplier: 1.25 }
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
    const fridayPeak = new Date('2026-11-20T17:00:00');
    const res1 = engine.calculateDynamicPrice(50, fridayPeak);
    expect(res1.isPeak).toBe(true);
    expect(res1.multiplier).toBe(1.2);
    expect(res1.finalPrice).toBe(60);

    const thursdayOffPeak = new Date('2026-11-19T14:00:00');
    const res2 = engine.calculateDynamicPrice(50, thursdayOffPeak);
    expect(res2.isPeak).toBe(false);
    expect(res2.multiplier).toBe(1.0);
    expect(res2.finalPrice).toBe(50);
  });

  test('evaluates bundle savings correctly', () => {
    const servicesMap = new Map([
      ['haircut', { id: 'haircut', name: 'Haircut', basePrice: 40, durationMinutes: 30, category: 'haircut' }],
      ['beard', { id: 'beard', name: 'Beard Trim', basePrice: 25, durationMinutes: 20, category: 'beard' }],
      ['facial', { id: 'facial', name: 'Express Facial', basePrice: 35, durationMinutes: 25, category: 'treatment' }]
    ]);

    const evaluation = engine.evaluateBundle('gentlemans-combo', servicesMap);
    expect(evaluation).not.toBeNull();
    expect(evaluation.totalIndividualPrice).toBe(100);
    expect(evaluation.bundlePrice).toBe(85);
    expect(evaluation.savings).toBe(15);
  });

  test('returns top add-on recommendations sorted by revenue potential', () => {
    const topAddOns = engine.getTopAddOnRecommendations(2);
    expect(topAddOns.length).toBe(2);
    expect(topAddOns[0].addOnId).toBe('hot-towel');
    expect(topAddOns[1].addOnId).toBe('scalp-massage');
  });

  test('calculates correct cart total with dynamic pricing and bundle savings', () => {
    const servicesMap = new Map([
      ['haircut', { id: 'haircut', name: 'Haircut', basePrice: 40, durationMinutes: 30, category: 'haircut' }],
      ['beard', { id: 'beard', name: 'Beard Trim', basePrice: 25, durationMinutes: 20, category: 'beard' }],
      ['facial', { id: 'facial', name: 'Express Facial', basePrice: 35, durationMinutes: 25, category: 'treatment' }]
    ]);

    const addOnsMap = new Map([
      ['hot-towel', { addOnId: 'hot-towel', name: 'Hot Towel Treatment', price: 15, attachProbability: 0.6, category: 'spa' }]
    ]);

    const saturdayPeak = new Date('2026-11-21T12:00:00');
    const cart = engine.calculateCartTotal(
      ['haircut', 'beard', 'facial'],
      ['hot-towel'],
      saturdayPeak,
      servicesMap,
      addOnsMap
    );

    expect(cart.subtotal).toBe(100);
    expect(cart.dynamicTotal).toBe(125);
    expect(cart.appliedSavings).toBe(15);
    expect(cart.addOnsTotal).toBe(15);
    expect(cart.finalTotal).toBe(125);
  });
});
