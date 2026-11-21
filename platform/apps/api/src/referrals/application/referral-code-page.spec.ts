/* eslint-disable max-lines -- cohesive module (289 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-4457: сторінка «Мій код» — посилання/QR, статуси запрошених
// без персональних даних, бали лише за підтверджений візит, місячний ліміт.
import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_REFERRAL_PROGRAM_CONFIG,
  ReferralCodePageError,
  buildReferralCodePage,
  normalizeReferralProgramConfig,
  referralMonthKey,
  referralShareText,
  referralShareUrl,
  type ReferralForCodePage,
  type ReferralProgramConfig,
} from '../domain/referral-code-page';
import { ReferralCode, Referral } from '../domain/referral.entity';
import { InMemoryReferralRepository } from './in-memory-referral.repository';
import { ReferralCodePageService } from './referral-code-page.service';
import { ReferralCodePageController } from '../infrastructure/referral-code-page.controller';

const NOW = new Date('2026-11-19T12:00:00Z');
const CONFIG = normalizeReferralProgramConfig({});

function referral(overrides: Partial<ReferralForCodePage> = {}): ReferralForCodePage {
  return {
    status: 'PENDING',
    createdAt: NOW,
    qualifiedAt: null,
    rewardIssuedAt: null,
    ...overrides,
  };
}

function storedReferral(input: {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REVOKED';
  createdAt?: Date;
  qualifiedAt?: Date | null;
  rewardIssuedAt?: Date | null;
}): Referral {
  return Referral.reconstitute({
    id: input.id,
    referrerId: input.referrerId,
    referredId: input.referredId,
    code: 'FADE-ABC123',
    status: input.status,
    createdAt: input.createdAt ?? NOW,
    qualifiedAt: input.qualifiedAt ?? null,
    rewardIssuedAt: input.rewardIssuedAt ?? null,
  });
}

describe('referral code page policy (T-4457)', () => {
  it('builds a share link, QR payload and share text from the code', () => {
    const view = buildReferralCodePage({
      code: ' fade-abc123 ',
      referrals: [],
      now: NOW,
      config: { ...CONFIG, shareBaseUrl: 'https://fade.app/r/' },
    });

    expect(view.code).toBe('FADE-ABC123');
    expect(view.shareUrl).toBe('https://fade.app/r/FADE-ABC123');
    expect(view.qrPayload).toBe(view.shareUrl);
    expect(view.shareText).toBe(
      referralShareText({
        code: 'FADE-ABC123',
        shareUrl: view.shareUrl,
        pointsPerReferral: CONFIG.pointsPerReferral,
      })
    );
    expect(view.shareText).toContain('FADE-ABC123');
    expect(view.shareText).toContain('200');
    expect(referralShareUrl('abc', { ...CONFIG, shareBaseUrl: 'https://x.app' })).toBe(
      'https://x.app/ABC'
    );
  });

  it('maps referral statuses and hides personal data of invited clients', () => {
    const view = buildReferralCodePage({
      code: 'FADE-ABC123',
      referrals: [
        referral({ status: 'PENDING' }),
        referral({
          status: 'QUALIFIED',
          qualifiedAt: new Date('2026-11-10T10:00:00Z'),
        }),
        referral({
          status: 'REWARDED',
          qualifiedAt: new Date('2026-11-05T10:00:00Z'),
          rewardIssuedAt: new Date('2026-11-06T10:00:00Z'),
        }),
        referral({ status: 'REVOKED' }),
      ],
      now: NOW,
    });

    expect(view.invitations.map((entry) => entry.status)).toEqual([
      'invited',
      'arrived',
      'rewarded',
      'revoked',
    ]);
    expect(new Set(view.invitations.map((entry) => entry.label))).toEqual(
      new Set(['Запрошений #1', 'Запрошений #2', 'Запрошений #3', 'Запрошений #4'])
    );
    const firstInvitation = view.invitations[0];
    if (!firstInvitation) throw new Error('expected invitation');
    expect(Object.keys(firstInvitation).sort()).toEqual([
      'arrivedAt',
      'invitedAt',
      'label',
      'rewardedAt',
      'status',
    ]);
    expect(view.totals).toEqual({
      invited: 1,
      arrived: 1,
      rewarded: 1,
      revoked: 1,
      total: 4,
    });
  });

  it('awards points only for a confirmed visit and keeps qualified points pending', () => {
    const view = buildReferralCodePage({
      code: 'FADE-ABC123',
      referrals: [
        referral({ status: 'PENDING' }),
        referral({ status: 'QUALIFIED' }),
        referral({ status: 'QUALIFIED' }),
        referral({ status: 'REWARDED' }),
        referral({ status: 'REVOKED' }),
      ],
      now: NOW,
    });

    expect(view.pointsPerReferral).toBe(200);
    expect(view.pointsEarned).toBe(200);
    expect(view.pointsPending).toBe(400);
  });

  it('counts invitations per Kyiv month and shows the remaining slots', () => {
    const config: ReferralProgramConfig = { ...CONFIG, monthlyLimit: 3 };
    const inNovember = referral({ createdAt: new Date('2026-11-02T09:00:00Z') });
    const lastDayOfOctoberKyiv = referral({ createdAt: new Date('2026-10-31T22:30:00Z') });
    const revoked = referral({ status: 'REVOKED', createdAt: new Date('2026-11-03T09:00:00Z') });

    const view = buildReferralCodePage({
      code: 'FADE-ABC123',
      referrals: [inNovember, revoked],
      now: NOW,
      config,
    });
    expect(view.monthly).toEqual({
      limit: 3,
      used: 1,
      remaining: 2,
      limitReached: false,
      month: '2026-11',
    });

    const boundary = buildReferralCodePage({
      code: 'FADE-ABC123',
      referrals: [lastDayOfOctoberKyiv],
      now: new Date('2026-11-01T09:00:00Z'),
      config,
    });
    expect(boundary.monthly.used).toBe(1);

    const full = buildReferralCodePage({
      code: 'FADE-ABC123',
      referrals: [
        referral({ createdAt: new Date('2026-11-02T09:00:00Z') }),
        referral({ createdAt: new Date('2026-11-04T09:00:00Z') }),
        referral({ createdAt: new Date('2026-11-05T09:00:00Z') }),
      ],
      now: NOW,
      config,
    });
    expect(full.monthly.remaining).toBe(0);
    expect(full.monthly.limitReached).toBe(true);
  });

  it('reports the limit as reached when the program allows zero invites', () => {
    const view = buildReferralCodePage({
      code: 'FADE-ABC123',
      referrals: [],
      now: NOW,
      config: { ...CONFIG, monthlyLimit: 0 },
    });
    expect(view.monthly).toMatchObject({ limit: 0, remaining: 0, limitReached: true });
    expect(view.shareUrl).toBe('https://fade.app/r/FADE-ABC123');
  });

  it('validates the program config and the code', () => {
    expect(() => normalizeReferralProgramConfig({ pointsPerReferral: 0 })).toThrow(
      'pointsPerReferral'
    );
    expect(() => normalizeReferralProgramConfig({ monthlyLimit: -1 })).toThrow('monthlyLimit');
    expect(() => normalizeReferralProgramConfig({ shareBaseUrl: 'fade.app/r' })).toThrow('http(s)');
    expect(() => normalizeReferralProgramConfig({ timeZone: ' ' })).toThrow('timeZone');
    expect(normalizeReferralProgramConfig({ shareBaseUrl: 'https://fade.app/r/' })).toMatchObject({
      shareBaseUrl: 'https://fade.app/r',
    });

    expect(() => buildReferralCodePage({ code: '  ', referrals: [], now: NOW })).toThrow(
      ReferralCodePageError
    );
  });

  it('derives the month key in the program time zone', () => {
    expect(referralMonthKey(new Date('2026-10-31T22:30:00Z'))).toBe('2026-11');
    expect(referralMonthKey(new Date('2026-11-30T22:30:00Z'))).toBe('2026-12');
    expect(referralMonthKey(new Date('2026-11-30T20:30:00Z'))).toBe('2026-11');
  });
});

describe('ReferralCodePageService (T-4457)', () => {
  function setup(seed?: ReferralCode) {
    const repository = new InMemoryReferralRepository();
    if (seed) {
      // saveCode синхронно в пам'яті, але контракт асинхронний.
      void repository.saveCode(seed);
    }
    let counter = 0;
    const service = new ReferralCodePageService(
      repository,
      {
        generate: () => {
          counter += 1;
          return `FADE-TEST${counter}`;
        },
      },
      { config: DEFAULT_REFERRAL_PROGRAM_CONFIG },
      { now: () => NOW }
    );
    return { repository, service };
  }

  it('creates the code on first view and reuses it later', async () => {
    const { service, repository } = setup();

    const first = await service.getPage('client-1');
    expect(first.code).toBe('FADE-TEST1');
    expect(first.shareUrl).toBe('https://fade.app/r/FADE-TEST1');
    expect((await repository.findCodeByClientId('client-1'))?.code).toBe('FADE-TEST1');

    const second = await service.getPage('client-1');
    expect(second.code).toBe('FADE-TEST1');
    expect(await repository.findCodeByClientId('client-1')).not.toBeNull();
  });

  it('keeps an existing code and only lists referrals of this client', async () => {
    const code = new ReferralCode({
      clientId: 'client-1',
      code: 'FADE-OLD777',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    const { service, repository } = setup(code);

    await repository.save(
      storedReferral({
        id: 'ref-1',
        referrerId: 'client-1',
        referredId: 'friend-1',
        status: 'REWARDED',
        qualifiedAt: new Date('2026-11-04T10:00:00Z'),
        rewardIssuedAt: new Date('2026-11-05T10:00:00Z'),
      })
    );
    await repository.save(
      storedReferral({
        id: 'ref-2',
        referrerId: 'client-2',
        referredId: 'friend-2',
        status: 'PENDING',
      })
    );

    const page = await service.getPage('client-1');
    expect(page.code).toBe('FADE-OLD777');
    expect(page.totals.total).toBe(1);
    expect(page.pointsEarned).toBe(200);
    expect(page?.invitations?.[0]?.status).toBe('rewarded');
  });

  it('rejects a blank client id and exposes the normalized program config', async () => {
    const { service } = setup();
    await expect(service.getPage('   ')).rejects.toThrow('Client id is required');
    expect(service.programConfig()).toEqual(DEFAULT_REFERRAL_PROGRAM_CONFIG);
  });
});

describe('ReferralCodePageController (T-4457)', () => {
  function setup() {
    const repository = new InMemoryReferralRepository();
    const service = new ReferralCodePageService(
      repository,
      { generate: () => 'FADE-CTRL01' },
      { config: DEFAULT_REFERRAL_PROGRAM_CONFIG },
      { now: () => NOW }
    );
    return new ReferralCodePageController(service);
  }

  it('serves the page and accepts an explicit date', async () => {
    const controller = setup();
    const page = await controller.page('client-1', NOW.toISOString());
    expect(page.code).toBe('FADE-CTRL01');
    expect(page.monthly.month).toBe('2026-11');
  });

  it('maps invalid dates and client ids to 400', async () => {
    const controller = setup();
    await expect(controller.page('client-1', 'yesterday')).rejects.toThrow(BadRequestException);
    await expect(controller.page('  ')).rejects.toThrow(BadRequestException);
  });
});
