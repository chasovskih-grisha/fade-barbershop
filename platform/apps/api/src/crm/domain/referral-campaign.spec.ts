import { createClientProfile } from './client-profile.types';
import { CampaignSentEvent } from './events';

describe('T-062: InviteCode, ReferredBy and CampaignSent', () => {
  it('generates inviteCode on profile creation', () => {
    const clock = { now: () => new Date('2026-11-16T12:00:00Z') };
    const ids = { id: () => 'id-1' };
    const { profile } = createClientProfile(
      { userId: 'user-1', phone: '+380501112233', name: 'John Doe' },
      clock,
      ids
    );

    expect(profile.inviteCode).toBeDefined();
    expect(profile.inviteCode.startsWith('REF-')).toBe(true);
    expect(profile.referredBy).toBeNull();
  });

  it('sets referredBy immutably (cannot be overwritten once set)', () => {
    const clock = { now: () => new Date('2026-11-16T12:00:00Z') };
    const ids = { id: () => 'id-2' };
    const { profile } = createClientProfile(
      { userId: 'user-2', phone: '+380502223344', name: 'Jane Doe' },
      clock,
      ids
    );

    profile.setReferredBy('referrer-1', clock);
    expect(profile.referredBy).toBe('referrer-1');

    // Attempting to overwrite referredBy should be ignored (immutable)
    profile.setReferredBy('referrer-2', clock);
    expect(profile.referredBy).toBe('referrer-1');
  });

  it('creates CampaignSentEvent with correct payload', () => {
    const sentAt = new Date('2026-11-16T12:00:00Z');
    const event = new CampaignSentEvent({
      clientId: 'client-1',
      campaignId: 'cmp-1',
      sentAt,
    });

    expect(event.type).toBe('crm.campaign.sent');
    expect(event.aggregateId).toBe('client-1');
    expect(event.payload).toEqual({
      clientId: 'client-1',
      campaignId: 'cmp-1',
      sentAt,
    });
  });
});
