import { calculateChairUtilization } from './chair-utilization';
import { calculateCommissionPayouts } from './commission';
import { buildProductivityReport } from './report';
import { optimizeServiceDurations } from './service-durations';
import type {
  AppointmentCommissionInput,
  ChairThroughputResult,
  ChairUtilizationRecord,
  CommissionConfig,
  CommissionPayoutResult,
  ProductivityReportRequest,
  ProductivityReportResult,
  ServiceDurationRecommendationResult,
  ServiceDurationRecord,
} from './types';

export class BarberProductivityEngine {
  public calculateChairUtilization(records: ChairUtilizationRecord[]): ChairThroughputResult {
    return calculateChairUtilization(records);
  }

  public optimizeServiceDurations(
    records: ServiceDurationRecord[]
  ): ServiceDurationRecommendationResult[] {
    return optimizeServiceDurations(records);
  }

  public calculateCommissionPayouts(
    appointments: AppointmentCommissionInput[],
    config: CommissionConfig,
    averageUtilization: number
  ): CommissionPayoutResult {
    return calculateCommissionPayouts(appointments, config, averageUtilization);
  }

  public generateProductivityReport(request: ProductivityReportRequest): ProductivityReportResult {
    const chairThroughput = this.calculateChairUtilization(request.chairRecords);
    return buildProductivityReport({
      request,
      chairThroughput,
      serviceDurationRecommendations: this.optimizeServiceDurations(request.serviceRecords),
      payoutSummary: this.calculateCommissionPayouts(
        request.appointments,
        request.commissionConfig,
        chairThroughput.averageUtilizationRate
      ),
    });
  }
}
