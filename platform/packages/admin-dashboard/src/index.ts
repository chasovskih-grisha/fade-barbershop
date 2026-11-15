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

export interface AdminControlPanelState {
  shopId: string;
  metrics: AdminShopMetrics;
  staff: AdminStaffMember[];
  auditLogs: { timestamp: string; action: string; performedBy: string }[];
}

export class AdminControlPanelEngine {
  private state: AdminControlPanelState;

  constructor(initialState: AdminControlPanelState) {
    this.state = initialState;
  }

  getState(): AdminControlPanelState {
    return this.state;
  }

  updateMetrics(newMetrics: Partial<AdminShopMetrics>, performedBy: string): AdminShopMetrics {
    this.state.metrics = { ...this.state.metrics, ...newMetrics };
    this.logAction(`Updated shop metrics`, performedBy);
    return this.state.metrics;
  }

  addStaffMember(staff: AdminStaffMember, performedBy: string): AdminStaffMember {
    const exists = this.state.staff.some(s => s.id === staff.id);
    if (exists) {
      throw new Error(`Staff member with ID ${staff.id} already exists.`);
    }
    this.state.staff.push(staff);
    this.logAction(`Added staff member: ${staff.name} (${staff.role})`, performedBy);
    return staff;
  }

  updateStaffMember(id: string, updates: Partial<AdminStaffMember>, performedBy: string): AdminStaffMember {
    const staff = this.state.staff.find(s => s.id === id);
    if (!staff) {
      throw new Error(`Staff member with ID ${id} not found.`);
    }
    Object.assign(staff, updates);
    this.logAction(`Updated staff member: ${staff.name}`, performedBy);
    return staff;
  }

  toggleStaffActive(id: string, performedBy: string): boolean {
    const staff = this.state.staff.find(s => s.id === id);
    if (!staff) {
      throw new Error(`Staff member with ID ${id} not found.`);
    }
    staff.active = !staff.active;
    this.logAction(`Toggled active status for ${staff.name} to ${staff.active}`, performedBy);
    return staff.active;
  }

  private logAction(action: string, performedBy: string) {
    this.state.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action,
      performedBy,
    });
  }
}
