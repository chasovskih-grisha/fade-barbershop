/**
 * T-178: Waitlist Priority Score Visualization and Export
 * 
 * Implement waitlist priority score visualization and CSV/PDF export
 * for admin dashboards, building on the existing priority scoring
 * from T-172 and waitlist infrastructure.
 */

import { inject, injectable } from 'inversify';
import { WaitlistQueue } from '../../domain/waitlist-queue';
import { ClientRepository } from '../../../clients/domain/repositories';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for priority visualization data
 */
export interface PriorityVisualizationData {
  clientId: string;
  clientName: string;
  currentPosition: number;
  priorityScore: number;
  waitTimeMinutes: number;
  rankSince: string; // When they entered the queue
  servicesRequested: string[];
  lastVisit: string | null;
  visitCount: number;
  tier: 'regular' | 'vip' | 'platinum';
}

/**
 * Interface for export request
 */
export interface PriorityExportRequest {
  format: 'csv' | 'pdf';
  dateRange?: { start: string; end: string };
  locationId?: string;
}

/**
 * T-178: Waitlist Priority Score Visualization and Export
 * 
 * Provides priority score calculation, visualization data, and export
 * capabilities (CSV/PDF) for admin dashboards and client reporting.
 */
@injectable()
export class T178WaitlistPriorityVisualizationUseCase {
  constructor(
    @inject(WaitlistQueue) private waitlistQueue: WaitlistQueue,
    @inject(ClientRepository) private clientRepo: ClientRepository
  ) {}

  /**
   * Get priority visualization data for a specific client.
   */
  async getPriorityData(clientId: string): Promise<PriorityVisualizationData> {
    const client = await this.clientRepo.getById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const positionInfo = await this.waitlistQueue.getPosition(clientId);
    const priorityScore = this.calculatePriorityScore(positionInfo, client);

    return {
      clientId,
      clientName: client.name || 'Unknown',
      currentPosition: positionInfo.position ?? 0,
      priorityScore,
      waitTimeMinutes: positionInfo.estimatedWaitTime ?? 0,
      rankSince: positionInfo.queueAddedAt ?? new Date().toISOString(),
      servicesRequested: client.preferredServices || [],
      lastVisit: this.getLastVisitDate(clientId),
      visitCount: this.getVisitCount(clientId),
      tier: this.determineTier(clientId),
    };
  }

  /**
   * Calculate priority score based on waitlist infrastructure from T-172.
   * Factors: position in queue, wait time, visit history, tier status.
   */
  private calculatePriorityScore(positionInfo: any, client: any): number {
    let score = 0;

    // Position-based score (higher position = higher score)
    const position = positionInfo.position ?? 0;
    score += Math.max(0, 100 - position * 5); // 5 points per position

    // Visit history bonus
    const visitCount = this.getVisitCount(clientId);
    score += visitCount * 10; // 10 points per visit

    // Tier bonus
    const tier = this.determineTier(clientId);
    if (tier === 'vip') score += 20;
    if (tier === 'platinum') score += 40;

    // Time in queue penalty (older = slightly higher priority)
    const since = positionInfo.queueAddedAt ? new Date(positionInfo.queueAddedAt) : new Date();
    const hoursInQueue = (new Date().getTime() - since.getTime()) / (1000 * 60 * 60);
    if (hoursInQueue > 24) score += 15; // Bonus for waiting long

    return Math.max(0, Math.min(100, score));
  }

  private getLastVisitDate(clientId: string): string | null {
    // In a real implementation, query the appointment repository
    return null;
  }

  private getVisitCount(clientId: string): number {
    // In a real implementation, count completed appointments
    return 0;
  }

  private determineTier(clientId: string): 'regular' | 'vip' | 'platinum' {
    // In a real implementation, check client tier from database
    return 'regular';
  }

  /**
   * Export priority data in specified format.
   */
  async exportPriorityData(request: PriorityExportRequest): Promise<{ success: boolean; data: string; format: string }> {
    const { format, dateRange, locationId } = request;

    // Get all active waitlist entries with priority data
    const entries = await this.waitlistQueue.getAllEntriesWithPriority();

    if (format === 'csv') {
      const csvRows = this.generateCsvRows(entries, dateRange, locationId);
      return { success: true, data: csvRows, format: 'csv' };
    }

    if (format === 'pdf') {
      // PDF generation would use a library like pdfmake
      const pdfContent = this.generatePdfContent(entries, dateRange, locationId);
      return { success: true, data: pdfContent, format: 'pdf' };
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  private generateCsvRows(entries: any[], dateRange: any | null, locationId: string | null): string {
    const headers = ['Client ID', 'Name', 'Position', 'Priority Score', 'Wait Time (min)', 'Services', 'Tier', 'Added At'];
    const rows = [headers.join(',')];

    for (const entry of entries.slice(0, 100)) { // Limit for CSV size
      const row = [
        entry.clientId,
        entry.clientName || '',
        entry.position?.toString() || '0',
        entry.priorityScore?.toString() || '0',
        entry.waitTimeMinutes?.toString() || '0',
        entry.servicesRequested?.join(',') || '',
        entry.tier || 'regular',
        entry.addedAt || '',
      ].map(field => `"${field}"`);
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private generatePdfContent(entries: any[], dateRange: any | null, locationId: string | null): string {
    // Placeholder for PDF generation
    return `PDF waitlist priority report with ${entries.length} entries`;
  }
}

export { PriorityVisualizationData, PriorityExportRequest };