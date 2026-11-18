import { InMemoryCampaignRepository } from './application/in-memory-campaign.repository';
import { CreateWinbackCampaignUseCase, SendWinbackCampaignUseCase, TrackCampaignUsageUseCase } from './application/campaign.use-cases';

describe('Winback Campaign & Reactivation Engine', () => {
  let repo: InMemoryCampaignRepository;
  let createCampaign: CreateWinbackCampaignUseCase;
  let sendCampaign: SendWinbackCampaignUseCase;
  let trackUsage: TrackCampaignUsageUseCase;

  beforeEach(() => {
    repo = new InMemoryCampaignRepository();
    createCampaign = new CreateWinbackCampaignUseCase(repo);
    sendCampaign = new SendWinbackCampaignUseCase(repo);
    trackUsage = new TrackCampaignUsageUseCase(repo);
  });

  it('should create and activate a win-back campaign with personal discount code', async () => {
    const campaign = await createCampaign.execute({
      name: 'Sleeping Clients 60+ Days Reactivation',
      segment: 'SLEEPING_60',
      discountPercent: 20,
      validDays: 14,
      targetCount: 150,
    });

    expect(campaign.id).toBeDefined();
    expect(campaign.status).toBe('ACTIVE');
    expect(campaign.discountCode).toMatch(/^WINBACK-SLEEPING_60-[A-Z0-9]+$/);
    expect(campaign.discountPercent).toBe(20);
  });

  it('should send campaign and enforce 30-day anti-spam throttle rule', async () => {
    const campaign = await createCampaign.execute({
      name: 'VIP Winback',
      segment: 'FORMER_VIP',
      discountPercent: 25,
      validDays: 7,
      targetCount: 50,
    });

    const sent = await sendCampaign.execute({ campaignId: campaign.id, clientCount: 45 });
    expect(sent.sentCount).toBe(45);
    expect(sent.lastSentAt).toBeDefined();

    // Trying to resend immediately should violate anti-spam throttle (30 days)
    await expect(
      sendCampaign.execute({ campaignId: campaign.id, clientCount: 45 })
    ).rejects.toThrow('Anti-spam rule');
  });

  it('should track campaign usage and revenue generated', async () => {
    const campaign = await createCampaign.execute({
      name: 'No Second Visit Reactivation',
      segment: 'NO_SECOND_VISIT',
      discountPercent: 15,
      validDays: 10,
      targetCount: 80,
    });

    await sendCampaign.execute({ campaignId: campaign.id, clientCount: 80 });

    const updated = await trackUsage.execute({
      discountCode: campaign.discountCode,
      revenueAmount: 850,
    });

    expect(updated.usedCount).toBe(1);
    expect(updated.revenueGenerated).toBe(850);
  });
});
