/**
 * T-181: Admin Waitlist Analytics Export & Reporting
 * 
 * Implement PDF/CSV report generation for waitlist performance metrics,
 * integrating with T-179 cascade analytics and T-180 dashboard foundations.
 * 
 * Key metrics: promotion rates, no-show correlations, seasonality trends.
 * Admin interface for report selection and download.
 */

import { WaitlistQueue } from '../domain/waitlist-queue';
import { ClientRepository } from '../../clients/domain/repositories';
import { uuidv7 } from '@fade/domain-shared';
import { PdfDocument } from '../../lib/pdf-document';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for report type selection
 */
export enum ReportType {
  PROMOTION_RATES = 'promotion_rates',
  NO_SHOW_CORRELATION = 'no_show_correlation',
  SEASONALITY_TRENDS = 'seasonality_trends',
  CASCADE_ANALYSIS = 'cascade_analysis',
  FIFO_METRICS = 'fifo_metrics',
  COMPREHENSIVE = 'comprehensive'
}

/**
 * Interface for report filter parameters
 */
export interface ReportFilter {
  locationId?: string;
  serviceId?: string;
  barberId?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reportType: ReportType;
}

/**
 * Interface for report data entry
 */
export interface ReportMetric {
  label: string;
  value: number | string;
  unit?: string;
}

/**
 * Interface for PDF report configuration
 */
export interface PdfReportConfig {
  title: string;
  subtitle: string;
  metrics: ReportMetric[];
  charts?: string[]; // placeholder for chart references
  generatedAt: string;
}

/**
 * T-181: Admin Waitlist Analytics Export & Reporting
 * 
 * Provides PDF/CSV report generation for waitlist performance metrics,
 * enabling administrators to download analytical reports on waitlist operations.
 */
export class T181AdminWaitlistAnalyticsExportUseCase {
  constructor(
    private waitlistQueue: WaitlistQueue,
    private clientRepo: ClientRepository
  ) {}

  /**
   * Generate a PDF report for the specified report type and filter range.
   */
  async generatePdfReport(filter: ReportFilter): Promise<{
    success: boolean;
    filePath: string;
    downloadUrl: string;
    reportType: ReportType;
    metrics: ReportMetric[];
  }> {
    // Get hold history for the specified date range
    const holds = await this.waitlistQueue.getHoldHistory(
      Math.ceil((new Date(filter.endDate).getTime() - new Date(filter.startDate).getTime()) / 86400000 / 24) + 1
    );

    // Filter by date range
    const filteredHolds = holds.filter(h => {
      const holdDate = new Date(h.waitingSince);
      return holdDate >= new Date(filter.startDate) && holdDate <= new Date(filter.endDate);
    });

    // Calculate metrics based on report type
    const metrics = this.calculateMetrics(filteredHolds, filter.reportType);

    // Generate PDF
    const fileName = `waitlist-analytics-${filter.reportType}-${uuidv7()}.pdf`;
    const filePath = path.join('/tmp', fileName);

    const doc = new PdfDocument({
      margin: 50,
      size: 'A4'
    });

    doc.pipe(fs.createWriteStream(filePath));

    this.writePdfHeader(doc, filter, metrics);
    this.writePdfMetrics(doc, metrics);
    this.writePdfTrends(doc, filteredHolds, filter.reportType);
    this.writePdfFooter(doc);

    doc.end();

    return {
      success: true,
      filePath,
      downloadUrl: `/downloads/${fileName}`,
      reportType: filter.reportType,
      metrics
    };
  }

  /**
   * Generate a CSV report for the specified report type and filter range.
   */
  async generateCsvReport(filter: ReportFilter): Promise<{
    success: boolean;
    csvContent: string;
    reportType: ReportType;
    metrics: ReportMetric[];
  }> {
    // Get hold history for the specified date range
    const holds = await this.waitlistQueue.getHoldHistory(
      Math.ceil((new Date(filter.endDate).getTime() - new Date(filter.startDate).getTime()) / 86400000 / 24) + 1
    );

    // Filter by date range
    const filteredHolds = holds.filter(h => {
      const holdDate = new Date(h.waitingSince);
      return holdDate >= new Date(filter.startDate) && holdDate <= new Date(filter.endDate);
    });

    // Calculate metrics based on report type
    const metrics = this.calculateMetrics(filteredHolds, filter.reportType);

    // Generate CSV content
    const rows: string[] = [];

    // Header row
    rows.push('Metric,Value,Unit');

    // Metric rows
    metrics.forEach(metric => {
      rows.push(`${metric.label},${metric.value}${metric.unit ? ',' + metric.unit : ''}`);
    });

    // Add summary data rows
    const summaryRows = this.generateCsvSummary(filteredHolds, filter.reportType);
    rows.push(...summaryRows);

    return {
      success: true,
      csvContent: rows.join('\n'),
      reportType: filter.reportType,
      metrics
    };
  }

  /**
   * Calculate metrics based on report type.
   */
  private calculateMetrics(holds: any[], reportType: ReportType): ReportMetric[] {
    const totalHolds = holds.length;
    const totalBooked = holds.filter(h => h.status === 'booked').length;
    const totalPromoted = totalBooked; // clients who moved from waitlist to booked
    const totalCancelled = holds.filter(h => h.status === 'cancelled').length;
    const totalNoShow = holds.filter(h => h.status === 'no-show' || h.status === 'expired').length;
    const totalExpired = holds.filter(h => h.status === 'expired').length;

    // Calculate wait times
    const waitTimes = holds
      .filter(h => h.estimatedWaitTime !== undefined && h.estimatedWaitTime > 0)
      .map(h => h.estimatedWaitTime);

    const averageWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((sum, w) => sum + w, 0) / waitTimes.length
      : 0;

    const medianWaitTime = waitTimes.length > 0
      ? this.median(waitTimes)
      : 0;

    // Promotion rate
    const promotionRate = totalHolds > 0 ? (totalPromoted / totalHolds) * 100 : 0;

    // No-show correlation (clients who no-showed after waitlist promotion)
    const noShowAfterPromotion = holds.filter(h => 
      h.status === 'no-show' || h.status === 'expired'
    ).length;
    const noShowRate = totalHolds > 0 ? (noShowAfterPromotion / totalHolds) * 100 : 0;

    // Cascade analysis
    const cascadeTriggers = holds.filter(h => h.triggerType === 'cascade').length;
    const cascadeRate = totalHolds > 0 ? (cascadeTriggers / totalHolds) * 100 : 0;

    // FIFO compliance
    const fifoCompliant = holds.filter(h => h.fifoCompliant === true).length;
    const fifoRate = totalBooked > 0 ? (fifoCompliant / totalBooked) * 100 : 0;

    // Seasonality - hourly distribution
    const hourCounts: Record<number, number> = {};
    holds.forEach(h => {
      const hour = new Date(h.waitingSince).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const offPeakHours = Object.entries(hourCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    switch (reportType) {
      case ReportType.PROMOTION_RATES:
        return [
          { label: 'Total Waitlist Holds', value: totalHolds.toString(), unit: 'entries' },
          { label: 'Promoted to Booked', value: totalPromoted.toString(), unit: 'entries' },
          { label: 'Promotion Rate', value: Number(promotionRate.toFixed(1)), unit: '%' },
          { label: 'Average Wait Time', value: Number(averageWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Median Wait Time', value: Number(medianWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'No-Show Rate', value: Number(noShowRate.toFixed(1)), unit: '%' }
        ];

      case ReportType.NO_SHOW_CORRELATION:
        return [
          { label: 'Total Waitlist Holds', value: totalHolds.toString(), unit: 'entries' },
          { label: 'No-Show Rate', value: Number(noShowRate.toFixed(1)), unit: '%' },
          { label: 'Consecutive Misses ≥ 3', value: totalNoShow.toString(), unit: 'entries' },
          { label: 'Clients Paused', value: holds.filter(h => h.consecutiveMisses >= 3).length.toString(), unit: 'entries' },
          { label: 'Cascade Triggers', value: cascadeTriggers.toString(), unit: 'events' },
          { label: 'Cascade Rate', value: Number(cascadeRate.toFixed(1)), unit: '%' }
        ];

      case ReportType.SEASONALITY_TRENDS:
        return [
          { label: 'Total Waitlist Holds', value: totalHolds.toString(), unit: 'entries' },
          { label: 'Peak Hour(s)', value: peakHours.join(', '), unit: 'hour' },
          { label: 'Off-Peak Hour(s)', value: offPeakHours.join(', '), unit: 'hour' },
          { label: 'Average Wait Time', value: Number(averageWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Median Wait Time', value: Number(medianWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Promotion Rate', value: Number(promotionRate.toFixed(1)), unit: '%' }
        ];

      case ReportType.CASCADE_ANALYSIS:
        return [
          { label: 'Total Waitlist Holds', value: totalHolds.toString(), unit: 'entries' },
          { label: 'Cascade Triggers', value: cascadeTriggers.toString(), unit: 'events' },
          { label: 'Cascade Rate', value: Number(cascadeRate.toFixed(1)), unit: '%' },
          { label: 'Average Cascade Depth', value: '(calculated separately)', unit: '' },
          { label: 'FIFO Compliance Rate', value: Number(fifoRate.toFixed(1)), unit: '%' },
          { label: 'Total Booked Slots', value: totalBooked.toString(), unit: 'slots' }
        ];

      case ReportType.FIFO_METRICS:
        return [
          { label: 'Total Booked Slots', value: totalBooked.toString(), unit: 'slots' },
          { label: 'FIFO Compliant', value: fifoCompliant.toString(), unit: 'slots' },
          { label: 'FIFO Compliance Rate', value: Number(fifoRate.toFixed(1)), unit: '%' },
          { label: 'Average Wait Time', value: Number(averageWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Median Wait Time', value: Number(medianWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Total Waitlist Holds', value: totalHolds.toString(), unit: 'entries' }
        ];

      case ReportType.COMPREHENSIVE:
        return [
          { label: 'Total Waitlist Holds', value: totalHolds.toString(), unit: 'entries' },
          { label: 'Promoted to Booked', value: totalPromoted.toString(), unit: 'entries' },
          { label: 'Promotion Rate', value: Number(promotionRate.toFixed(1)), unit: '%' },
          { label: 'No-Show Rate', value: Number(noShowRate.toFixed(1)), unit: '%' },
          { label: 'Cascade Triggers', value: cascadeTriggers.toString(), unit: 'events' },
          { label: 'Cascade Rate', value: Number(cascadeRate.toFixed(1)), unit: '%' },
          { label: 'FIFO Compliance Rate', value: Number(fifoRate.toFixed(1)), unit: '%' },
          { label: 'Average Wait Time', value: Number(averageWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Median Wait Time', value: Number(medianWaitTime.toFixed(0)), unit: 'minutes' },
          { label: 'Peak Hour(s)', value: peakHours.join(', '), unit: 'hour' }
        ];

      default:
        return [];
    }
  }

  /**
   * Generate CSV summary rows.
   */
  private generateCsvSummary(holds: any[], reportType: ReportType): string[] {
    const rows: string[] = [];

    switch (reportType) {
      case ReportType.PROMOTION_RATES:
        rows.push('Promotion Rate Summary,' + ((holds.filter(h => h.status === 'booked').length / holds.length) * 100).toFixed(1));
        break;
      case ReportType.NO_SHOW_CORRELATION:
        rows.push('No-Show Summary,' + (holds.filter(h => h.status === 'no-show' || h.status === 'expired').length / holds.length * 100).toFixed(1));
        break;
      case ReportType.SEASONALITY_TRENDS:
        // Hour distribution
        const hourCounts: Record<number, number> = {};
        holds.forEach(h => {
          const hour = new Date(h.waitingSince).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
        rows.push('Top Hour,' + sortedHours[0][0] + ',' + sortedHours[0][1]);
        rows.push('Bottom Hour,' + sortedHours[sortedHours.length - 1][0] + ',' + sortedHours[sortedHours.length - 1][1]);
        break;
      case ReportType.CASCADE_ANALYSIS:
        rows.push('Cascade Analysis,' + holds.filter(h => h.triggerType === 'cascade').length + ',' + (holds.length > 0 ? (holds.filter(h => h.triggerType === 'cascade').length / holds.length * 100).toFixed(1) : 0));
        break;
      case ReportType.FIFO_METRICS:
        rows.push('FIFO Summary,' + (holds.filter(h => h.fifoCompliant === true).length / (holds.filter(h => h.status === 'booked').length || 1) * 100).toFixed(1));
        break;
      default:
        break;
    }

    return rows;
  }

  /**
   * Calculate median of array.
   */
  private median(arr: number[]): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Write PDF header.
   */
  private writePdfHeader(doc: any, filter: ReportFilter, metrics: ReportMetric[]): void {
    doc.fontSize(20).text('Waitlist Analytics Report', { align: 'center' });
    doc.fontSize(10).text(`Report Type: ${filter.reportType}`, { align: 'center' });
    doc.fontSize(10).text(`Period: ${filter.startDate} to ${filter.endDate}`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
  }

  /**
   * Write PDF metrics section.
   */
  private writePdfMetrics(doc: any, metrics: ReportMetric[]): void {
    doc.fontSize(14).text('Key Metrics', { underline: true });
    doc.moveDown(0.5);

    metrics.forEach((metric, index) => {
      doc.fontSize(11).text(`${index + 1}. ${metric.label}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`);
    });

    doc.moveDown(2);
  }

  /**
   * Write PDF trends section.
   */
  private writePdfTrends(doc: any, holds: any[], reportType: ReportType): void {
    doc.fontSize(14).text('Trends & Patterns', { underline: true });
    doc.moveDown(0.5);

    // Basic trend information based on report type
    const totalHolds = holds.length;
    const totalBooked = holds.filter(h => h.status === 'booked').length;

    doc.fontSize(11).text(`Total Waitlist Holds: ${totalHolds}`);
    doc.fontSize(11).text(`Promoted to Booked: ${totalBooked} (${((totalBooked / totalHolds) * 100).toFixed(1)}%)`);
    doc.fontSize(11).text(`Status Distribution: booked=${holds.filter(h => h.status === 'booked').length}, cancelled=${holds.filter(h => h.status === 'cancelled').length}, expired=${holds.filter(h => h.status === 'expired').length}, no-show=${holds.filter(h => h.status === 'no-show' || h.status === 'expired').length}`);

    doc.moveDown(2);
  }

  /**
   * Write PDF footer.
   */
  private writePdfFooter(doc: any): void {
    doc.moveTo(50, doc.page.height - 50);
    doc.lineTo(doc.page.width - 50, doc.page.height - 50);
    doc.stroke();
    doc.fontSize(9).text('Generated by Barbershop Platform - T-181 Waitlist Analytics', { align: 'center' });
  }
}

export type { ReportType as ReportType };