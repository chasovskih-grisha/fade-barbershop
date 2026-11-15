export interface AdminStaffMember {
  id: string;
  name: string;
  role: 'owner' | 'barber' | 'receptionist';
  email: string;
  phone: string;
  active: boolean;
  commissionRate: number; // percentage e.g. 60
  servicesCanPerform: string[];
}

export interface AdminShopMetrics {
  totalRevenueToday: number;
  totalAppointmentsToday: number;
  activeBarbersCount: number;
  occupancyRate: number; // percentage
}

export interface RoleBasedAccessControlPolicy {
  role: 'owner' | 'barber' | 'receptionist';
  permissions: string[];
}

export interface AdminControlPanelState {
  shopId: string;
  metrics: AdminShopMetrics;
  staff: AdminStaffMember[];
  rbacPolicies: RoleBasedAccessControlPolicy[];
  auditLogs: { timestamp: string; action: string; performedBy: string; roleUsed: string }[];
}

export class AdminControlPanelEngine {
  private state: AdminControlPanelState;

  constructor(initialState: AdminControlPanelState) {
    this.state = initialState;
  }

  getState(): AdminControlPanelState {
    return this.state;
  }

  private checkPermission(performedByRole: 'owner' | 'barber' | 'receptionist', requiredPermission: string): void {
    const policy = this.state.rbacPolicies.find(p => p.role === performedByRole);
    if (!policy || !policy.permissions.includes(requiredPermission)) {
      throw new Error(`Access Denied: Role '${performedByRole}' lacks permission '${requiredPermission}'.`);
    }
  }

  updateMetrics(newMetrics: Partial<AdminShopMetrics>, performedBy: string, performedByRole: 'owner' | 'barber' | 'receptionist'): AdminShopMetrics {
    this.checkPermission(performedByRole, 'manage_metrics');
    this.state.metrics = { ...this.state.metrics, ...newMetrics };
    this.logAction(`Updated shop metrics`, performedBy, performedByRole);
    return this.state.metrics;
  }

  addStaffMember(staff: AdminStaffMember, performedBy: string, performedByRole: 'owner' | 'barber' | 'receptionist'): AdminStaffMember {
    this.checkPermission(performedByRole, 'manage_staff');
    const exists = this.state.staff.some(s => s.id === staff.id);
    if (exists) {
      throw new Error(`Staff member with ID ${staff.id} already exists.`);
    }
    this.state.staff.push(staff);
    this.logAction(`Added staff member: ${staff.name} (${staff.role})`, performedBy, performedByRole);
    return staff;
  }

  updateStaffMember(id: string, updates: Partial<AdminStaffMember>, performedBy: string, performedByRole: 'owner' | 'barber' | 'receptionist'): AdminStaffMember {
    this.checkPermission(performedByRole, 'manage_staff');
    const staff = this.state.staff.find(s => s.id === id);
    if (!staff) {
      throw new Error(`Staff member with ID ${id} not found.`);
    }
    Object.assign(staff, updates);
    this.logAction(`Updated staff member: ${staff.name}`, performedBy, performedByRole);
    return staff;
  }

  toggleStaffActive(id: string, performedBy: string, performedByRole: 'owner' | 'barber' | 'receptionist'): boolean {
    this.checkPermission(performedByRole, 'manage_staff');
    const staff = this.state.staff.find(s => s.id === id);
    if (!staff) {
      throw new Error(`Staff member with ID ${id} not found.`);
    }
    staff.active = !staff.active;
    this.logAction(`Toggled active status for ${staff.name} to ${staff.active}`, performedBy, performedByRole);
    return staff.active;
  }

  private logAction(action: string, performedBy: string, roleUsed: string) {
    this.state.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action,
      performedBy,
      roleUsed,
    });
  }
}
