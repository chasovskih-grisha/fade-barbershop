import { BarberPeakLoadDispatchOptimizer } from './barber-peak-load-dispatch-optimizer';

describe('BarberPeakLoadDispatchOptimizer', () => {
  it('dispatches waitlist clients to primary barbers when under capacity', () => {
    const result = BarberPeakLoadDispatchOptimizer.optimize({
      currentMinute: 540,
      barbers: [
        {
          barberId: 'b1',
          chairId: 'c1',
          currentQueueLength: 1,
          utilizationRate: 0.6,
          isAuxiliaryChair: false,
          speedFactor: 1.0,
        },
        {
          barberId: 'b2',
          chairId: 'c2',
          currentQueueLength: 0,
          utilizationRate: 0.4,
          isAuxiliaryChair: false,
          speedFactor: 1.1,
        },
      ],
      waitlist: [
        {
          clientId: 'w1',
          clientName: 'Alice',
          serviceDurationMinutes: 30,
          priorityScore: 85,
          requestedTimeSlotMinute: 540,
        },
        {
          clientId: 'w2',
          clientName: 'Bob',
          serviceDurationMinutes: 45,
          priorityScore: 70,
          requestedTimeSlotMinute: 540,
        },
      ],
    });

    expect(result.totalWaitlistClients).toBe(2);
    expect(result.dispatchedCount).toBe(2);
    expect(result.deferredCount).toBe(0);
    expect(result.allocations[0]?.dispatchStatus).toBe('dispatched_primary');
  });

  it('routes overflow to auxiliary chairs when primary barbers exceed queue / utilization threshold', () => {
    const result = BarberPeakLoadDispatchOptimizer.optimize({
      currentMinute: 600,
      barbers: [
        {
          barberId: 'b1',
          chairId: 'c1',
          currentQueueLength: 3,
          utilizationRate: 0.85,
          isAuxiliaryChair: false,
          speedFactor: 1.0,
        },
        {
          barberId: 'aux1',
          chairId: 'ac1',
          currentQueueLength: 0,
          utilizationRate: 0.1,
          isAuxiliaryChair: true,
          speedFactor: 1.0,
        },
      ],
      waitlist: [
        {
          clientId: 'w1',
          clientName: 'Charlie',
          serviceDurationMinutes: 30,
          priorityScore: 90,
          requestedTimeSlotMinute: 600,
        },
      ],
    });

    expect(result.dispatchedCount).toBe(1);
    expect(result.auxiliaryChairsActivated).toBe(1);
    expect(result.allocations[0]?.dispatchStatus).toBe('dispatched_auxiliary');
    expect(result.allocations[0]?.assignedBarberId).toBe('aux1');
  });
});
