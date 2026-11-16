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
    rbacPolicies: [
      { role: 'owner', permissions: ['manage_metrics', 'manage_staff', 'view_audit_logs'] },
      { role: 'barber', permissions: [] },
      { role: 'receptionist', permissions: ['manage_metrics'] },
    ],
    auditLogs: [],
  };

  it('should initialize with correct state and metrics', () => {
    const engine = new AdminControlPanelEngine(initialState);
    expect(engine.getState().shopId).toBe('shop-01');
    expect(engine.getState().metrics.totalRevenueToday).toBe(840);
  });

  it('should update metrics and log action with RBAC checks', () => {
    const engine = new AdminControlPanelEngine(initialState);
    engine.updateMetrics({ totalRevenueToday: 950 }, 'owner@fade.platform', 'owner');
    
    expect(engine.getState().metrics.totalRevenueToday).toBe(950);
    expect(engine.getState().auditLogs.length).toBe(1);
    expect(engine.getState().auditLogs[0].action).toContain('Updated shop metrics');
    expect(engine.getState().auditLogs[0].roleUsed).toBe('owner');
  });

  it('should enforce RBAC permissions and deny unauthorized actions', () => {
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

    // Barber lacks manage_staff permission
    expect(() => {
      engine.addStaffMember(newStaff, 'marcus@fade.platform', 'barber');
    }).toThrow("Access Denied: Role 'barber' lacks permission 'manage_staff'.");

    // Owner succeeds
    engine.addStaffMember(newStaff, 'owner@fade.platform', 'owner');
    expect(engine.getState().staff.length).toBe(2);

    engine.toggleStaffActive('barber-2', 'owner@fade.platform', 'owner');
    const staff = engine.getState().staff.find((s: { id: string }) => s.id === 'barber-2');
    expect(staff?.active).toBe(false);
    expect(engine.getState().auditLogs.length).toBe(3);
  });

  it('should generate daily performance report with correct analytics and RBAC check', () => {
    const engine = new AdminControlPanelEngine(initialState);
    engine.updateMetrics({ totalRevenueToday: 950 }, 'owner@fade.platform', 'owner');

    // Owner has view_audit_logs permission which gates report generation
    const report = engine.generateDailyPerformanceReport('owner@fade.platform', 'owner');
    expect(report.shopId).toBe('shop-01');
    expect(report.activeStaffCount).toBe(1);
    expect(report.averageRevenuePerAppointment).toBe(67.86); // 950 / 14 = 67.857... rounded to 67.86
    expect(report.occupancyStatus).toBe('Optimal'); // 85 is not > 85
  });

});
