/**
 * FADE Barber Productivity & Capacity Engine
 * Optimizes barber scheduling, chair utilization, service duration estimates, and commission/payout reporting.
 */

export interface BarberProfile {
  id: string;
  name: string;
  chairId: string;
  efficiencyRating: number; // multiplier e.g. 1.1 for 10% faster than average
  defaultCommissionRate: number; // e.g. 0.60 for 60%
}

export interface Appointment {
  id: string;
  barberId: string;
  serviceName: string;
  baseDurationMinutes: number;
  actualDurationMinutes?: number;
  price: number;
  completed: boolean;
}

export interface ChairUtilizationReport {
  chairId: string;
  totalAvailableMinutes: number;
  bookedMinutes: number;
  utilizationRate: number; // percentage
}

export interface PayoutReport {
  barberId: string;
  totalSales: number;
  commissionRate: number;
  payoutAmount: number;
  bonusAmount: number;
  finalPayout: number;
}

export class BarberProductivityEngine {
  private barbers: Map<string, BarberProfile> = new Map();
  private appointments: Appointment[] = [];

  constructor(barbers: BarberProfile[]) {
    barbers.forEach(b => this.barbers.set(b.id, b));
  }

  public registerAppointment(appt: Appointment): void {
    const barber = this.barbers.get(appt.barberId);
    if (barber && appt.actualDurationMinutes === undefined) {
      appt.actualDurationMinutes = Math.round(appt.baseDurationMinutes / barber.efficiencyRating);
    }
    this.appointments.push(appt);
  }

  public calculateChairUtilization(chairId: string, totalAvailableMinutes: number = 480): ChairUtilizationReport {
    const chairBarbers = Array.from(this.barbers.values()).filter(b => b.chairId === chairId).map(b => b.id);
    const bookedMinutes = this.appointments
      .filter(a => chairBarbers.includes(a.barberId) && a.completed)
      .reduce((acc, curr) => acc + (curr.actualDurationMinutes || curr.baseDurationMinutes), 0);

    const utilizationRate = totalAvailableMinutes > 0 ? (bookedMinutes / totalAvailableMinutes) * 100 : 0;

    return {
      chairId,
      totalAvailableMinutes,
      bookedMinutes,
      utilizationRate: Number(utilizationRate.toFixed(2))
    };
  }

  public calculatePayout(barberId: string, performanceBonusThreshold: number = 1000, bonusMultiplier: number = 0.05): PayoutReport {
    const barber = this.barbers.get(barberId);
    if (!barber) {
      throw new Error(`Barber not found: ${barberId}`);
    }

    const barberAppts = this.appointments.filter(a => a.barberId === barberId && a.completed);
    const totalSales = barberAppts.reduce((acc, curr) => acc + curr.price, 0);

    const payoutAmount = totalSales * barber.defaultCommissionRate;
    const bonusAmount = totalSales >= performanceBonusThreshold ? totalSales * bonusMultiplier : 0;
    const finalPayout = payoutAmount + bonusAmount;

    return {
      barberId,
      totalSales,
      commissionRate: barber.defaultCommissionRate,
      payoutAmount: Number(payoutAmount.toFixed(2)),
      bonusAmount: Number(bonusAmount.toFixed(2)),
      finalPayout: Number(finalPayout.toFixed(2))
    };
  }
}
