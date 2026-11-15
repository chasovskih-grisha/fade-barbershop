import { AdminControlPanelEngine, AdminControlPanelState } from '../src/index';

describe('AdminControlPanelEngine', () => {
  const initialState: AdminControlPanelState = {
    shopId: 'shop-01',
    metrics: {
      totalRevenueToday: 840,
      totalAppointmentsToday: 14,
      activeBarbersCount: 3,
      occupancyRate: 85,
    },
    staff: [
      {
        id: 'barber-1',
        name: 'Marcus Fade',
        role: 'barber',
        email: 'marcus@fade.platform',
        phone: '+15550192',
        active: true,
        commissionRate: 60,
        servicesCanPerform: ['Fade & Beard', 'Classic Cut'],
      },
    ],
    auditLogs: [],
  };

  it('should initialize with correct state and metrics', () => {
    const engine = new AdminControlPanelEngine(initialState);
    expect(engine.getState().shopId).toBe('shop-01');
    expect(engine.getState().metrics.totalRevenueToday).toBe(840);
  });

  it('should update metrics and log action', () => {
    const engine = new AdminControlPanelEngine(initialState);
    engine.updateMetrics({ totalRevenueToday: 950 }, 'owner@fade.platform');
    
    expect(engine.getState().metrics.totalRevenueToday).toBe(950);
    expect(engine.getState().auditLogs.length).toBe(1);
    expect(engine.getState().auditLogs[0].action).toContain('Updated shop metrics');
  });

  it('should add a new staff member and toggle active status securely', () => {
    const engine = new AdminControlPanelEngine(initialState);
    const newStaff = {
      id: 'barber-2',
      name: 'Elena Razor',
      role: 'barber' as const,
      email: 'elena@fade.platform',
      phone: '+15550193',
      active: true,
      commissionRate: 65,
      servicesCanPerform: ['Precision Cut', 'Hot Towel Shave'],
    };

    engine.addStaffMember(newStaff, 'owner@fade.platform');
    expect(engine.getState().staff.length).toBe(2);

    engine.toggleStaffActive('barber-2', 'owner@fade.platform');
    const staff = engine.getState().staff.find((s: { id: string }) => s.id === 'barber-2');
    expect(staff?.active).toBe(false);
    expect(engine.getState().auditLogs.length).toBe(3);
  });
});
