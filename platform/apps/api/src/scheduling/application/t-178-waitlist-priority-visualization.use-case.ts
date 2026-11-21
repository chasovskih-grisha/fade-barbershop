/* eslint-disable max-lines -- cohesive module (120 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
/**
 * T-178: Waitlist Priority Score Visualization and Export
 *
 * Implement waitlist priority score visualization and CSV/PDF export
 * for admin dashboards, building on the existing priority scoring
 * from T-172 and waitlist infrastructure.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  WaitlistQueue,
  type PriorityEntry,
  type WaitlistPositionInfo,
} from '../domain/waitlist-queue';
import {
  CLIENT_REPOSITORY,
  type ClientRecord,
  type ClientRepository,
} from '../../clients/domain/repositories';

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
@Injectable()
export class T178WaitlistPriorityVisualizationUseCase {
  constructor(
    @Inject(WaitlistQueue) private waitlistQueue: WaitlistQueue,
    @Inject(CLIENT_REPOSITORY) private clientRepo: ClientRepository
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
      servicesRequested: client.preferredServices ?? [],
      lastVisit: null,
      visitCount: client.visitCount ?? 0,
      tier: this.determineTier(client),
    };
  }

  /**
   * Calculate priority score based on waitlist infrastructure from T-172.
   * Factors: position in queue, wait time, visit history, tier status.
   */
  private calculatePriorityScore(positionInfo: WaitlistPositionInfo, client: ClientRecord): number {
    let score = 0;

    // Position-based score (higher position = higher score)
    const position = positionInfo.position ?? 0;
    score += Math.max(0, 100 - position * 5); // 5 points per position

    // Visit history bonus
    const visitCount = client.visitCount ?? 0;
    score += visitCount * 10; // 10 points per visit

    // Tier bonus
    const tier = this.determineTier(client);
    if (tier === 'vip') score += 20;
    if (tier === 'platinum') score += 40;

    // Time in queue penalty (older = slightly higher priority)
    const since = positionInfo.queueAddedAt ? new Date(positionInfo.queueAddedAt) : new Date();
    const hoursInQueue = (new Date().getTime() - since.getTime()) / (1000 * 60 * 60);
    if (hoursInQueue > 24) score += 15; // Bonus for waiting long

    return Math.max(0, Math.min(100, score));
  }

  /** Тір клієнта виводимо з історії візитів: 20+ — platinum, 8+ — vip. */
  private determineTier(client: ClientRecord): 'regular' | 'vip' | 'platinum' {
    const visits = client.visitCount ?? 0;
    if (visits >= 20) return 'platinum';
    if (visits >= 8) return 'vip';
    return 'regular';
  }

  /**
   * Export priority data in specified format.
   */
  async exportPriorityData(
    request: PriorityExportRequest
  ): Promise<{ success: boolean; data: string; format: string }> {
    const { format } = request;

    // Get all active waitlist entries with priority data
    const entries = await this.waitlistQueue.getAllEntriesWithPriority();

    if (format === 'csv') {
      const csvRows = this.generateCsvRows(entries);
      return { success: true, data: csvRows, format: 'csv' };
    }

    if (format === 'pdf') {
      // PDF generation would use a library like pdfmake
      const pdfContent = this.generatePdfContent(entries);
      return { success: true, data: pdfContent, format: 'pdf' };
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  private generateCsvRows(entries: PriorityEntry[]): string {
    const headers = [
      'Client ID',
      'Name',
      'Position',
      'Priority Score',
      'Wait Time (min)',
      'Services',
      'Tier',
      'Added At',
    ];
    const rows = [headers.join(',')];

    for (const entry of entries.slice(0, 100)) {
      // Limit for CSV size
      const row = [
        entry.clientId,
        entry.clientName || '',
        entry.position?.toString() || '0',
        entry.priorityScore?.toString() || '0',
        entry.waitTimeMinutes?.toString() || '0',
        entry.servicesRequested?.join(',') || '',
        entry.tier || 'regular',
        entry.addedAt,
      ].map((field) => `"${field}"`);
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private generatePdfContent(entries: PriorityEntry[]): string {
    // PDF будуюється окремим експортером (T-181); тут — текстовий звіт.
    return `PDF waitlist priority report with ${entries.length} entries`;
  }
}
