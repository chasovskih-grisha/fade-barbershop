import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CampaignSentRepository, CampaignSentRecord } from '../domain/campaign-sent.repository';

@Injectable()
export class PrismaCampaignSentRepository implements CampaignSentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(record: CampaignSentRecord): Promise<void> {
    await this.prisma.campaignSent.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        campaignId: record.campaignId,
        clientId: record.clientId,
        sentAt: record.sentAt,
      },
      update: {
        campaignId: record.campaignId,
        clientId: record.clientId,
        sentAt: record.sentAt,
      },
    });
  }

  async wasSentWithinDays(clientId: string, campaignId: string, days: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const count = await this.prisma.campaignSent.count({
      where: {
        clientId,
        campaignId,
        sentAt: { gte: cutoff },
      },
    });
    return count > 0;
  }
}
