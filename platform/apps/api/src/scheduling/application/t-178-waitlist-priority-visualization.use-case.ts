/** T-178: Waitlist Priority Score Visualization and Export */
import { Inject, Injectable } from '@nestjs/common';
import { PdfDocument } from '../../lib/pdf-document';
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

export interface PriorityVisualizationData {
  clientId: string; clientName: string; currentPosition: number; priorityScore: number; waitTimeMinutes: number; rankSince: string; servicesRequested: string[]; lastVisit: string | null; visitCount: number; tier: 'regular' | 'vip' | 'platinum';
}

export interface PriorityExportRequest {
  format: 'csv' | 'pdf'; dateRange?: { start: string; end: string }; locationId?: string;
}

@Injectable()
export class T178WaitlistPriorityVisualizationUseCase {
  constructor(
    @Inject(WaitlistQueue) private waitlistQueue: WaitlistQueue,
    @Inject(CLIENT_REPOSITORY) private clientRepo: ClientRepository
  ) {}

  async getPriorityData(clientId: string): Promise<PriorityVisualizationData> {
    const client = await this.clientRepo.getById(clientId);
    if (!client) throw new Error('Client not found');
    const positionInfo = await this.waitlistQueue.getPosition(clientId);
    const priorityScore = this.calculatePriorityScore(positionInfo, client);
    return {
      clientId, clientName: client.name || 'Unknown',
      currentPosition: positionInfo.position ?? 0, priorityScore,
      waitTimeMinutes: positionInfo.estimatedWaitTime ?? 0,
      rankSince: positionInfo.queueAddedAt ?? new Date().toISOString(),
      servicesRequested: client.preferredServices ?? [],
      lastVisit: null, visitCount: client.visitCount ?? 0, tier: this.determineTier(client),
    };
  }

  private calculatePriorityScore(
    positionInfo: WaitlistPositionInfo,
    client: ClientRecord
  ): number {
    let score = 0; const position = positionInfo.position ?? 0;
    score += Math.max(0, 100 - position * 5);
    const visitCount = client.visitCount ?? 0; score += visitCount * 10;
    const tier = this.determineTier(client);
    if (tier === 'vip') score += 20;
    if (tier === 'platinum') score += 40;
    const since = positionInfo.queueAddedAt ? new Date(positionInfo.queueAddedAt) : new Date();
    const hoursInQueue = (new Date().getTime() - since.getTime()) / (1000 * 60 * 60);
    if (hoursInQueue > 24) score += 15;
    return Math.max(0, Math.min(100, score));
  }

  private determineTier(client: ClientRecord): 'regular' | 'vip' | 'platinum' {
    const visits = client.visitCount ?? 0;
    if (visits >= 20) return 'platinum';
    if (visits >= 8) return 'vip';
    return 'regular';
  }

  async exportPriorityData(
    request: PriorityExportRequest
  ): Promise<{ success: boolean; data: string; format: string }> {
    const { format } = request;
    const entries = await this.waitlistQueue.getAllEntriesWithPriority();
    if (format === 'csv') return { success: true, data: this.generateCsvRows(entries), format: 'csv' };
    if (format === 'pdf') {
      const pdfDoc = new PdfDocument({ size: 'A4' });
      pdfDoc.text('Waitlist Priority Report'); pdfDoc.moveDown(2);
      pdfDoc.text(`Total Entries: ${entries.length}`); pdfDoc.moveDown(2);
      for (const entry of entries.slice(0, 50)) {
        pdfDoc.text(`- ${entry.clientName}: Position ${entry.position}, Priority ${entry.priorityScore}`); pdfDoc.moveDown(0.5);
      }
      const pdfBytes = pdfDoc.toBuffer();
      const pdfBase64 = pdfBytes.toString('base64');
      return { success: true, data: pdfBase64, format: 'pdf' };
    }
    throw new Error(`Unsupported format: ${format}`);
  }

  private generateCsvRows(entries: PriorityEntry[]): string {
    const headers = ['Client ID', 'Name', 'Position', 'Priority Score', 'Wait Time (min)', 'Services', 'Tier', 'Added At'];
    const rows = [headers.join(',')];
    for (const entry of entries.slice(0, 100)) {
      const row = [
        entry.clientId, entry.clientName || '', entry.position?.toString() || '0',
        entry.priorityScore?.toString() || '0', entry.waitTimeMinutes?.toString() || '0',
        entry.servicesRequested?.join(',') || '', entry.tier || 'regular', entry.addedAt,
      ].map((field) => `"${field}"`);
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }
}