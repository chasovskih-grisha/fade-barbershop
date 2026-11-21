/* eslint-disable max-lines -- cohesive module (202 lines vs 100 limit after formatting reflow); decomposition deferred to T-2500f */
// Специфікація T-190: життєвий цикл елемента галереї (згода → модерація →
// публікація/приховування), миттєве відкликання згоди й публічна проєкція.
import {
  MAX_AFTER_PHOTOS,
  PortfolioConflictError,
  PortfolioError,
  PortfolioForbiddenError,
  PortfolioItem,
  hasPublishableConsent,
  statusForConsent,
  type CreatePortfolioItemInput,
} from './portfolio-item';
import { InMemoryPortfolioRepository, PortfolioService } from '../application/portfolio.service';

const AT = new Date('2026-11-21T10:00:00Z');

function afterPhoto(url = 'https://cdn.example/after.jpg') {
  return { url };
}

function item(overrides: Partial<Parameters<typeof PortfolioItem.create>[0]> = {}) {
  return PortfolioItem.create({
    id: 'item-1',
    barberId: 'barber-1',
    category: 'haircut',
    after: [afterPhoto()],
    at: AT,
    ...overrides,
  });
}

function publishable(consent?: CreatePortfolioItemInput['consent']) {
  return item({
    consent: consent ?? { opinion: 'yes', obtainedVia: 'optin_screen', by: 'client-1', at: AT },
  });
}

describe('portfolio consent and moderation cycle (T-190)', () => {
  it('starts without consent in pending_consent and stays out of the public gallery', async () => {
    const repository = new InMemoryPortfolioRepository();
    const service = new PortfolioService(repository);

    const created = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      after: [afterPhoto()],
      at: AT,
    });

    expect(created.status).toBe('pending_consent');
    expect(await service.publicGallery('barber-1')).toEqual([]);
  });

  it('treats the chair note as verbal consent only — still no publication (PRT-BAR-02)', () => {
    const verbal = item({
      consent: { opinion: 'yes', obtainedVia: 'barber_chair', by: 'barber-1', at: AT },
    });

    expect(verbal.status).toBe('pending_consent');
    expect(hasPublishableConsent(verbal.toState().consent)).toBe(false);
    expect(() => verbal.publish({ by: 'admin-1', role: 'admin', at: AT })).toThrow(
      PortfolioConflictError
    );
  });

  it('moves opt-in consent to pending_review, then publishes only as admin', () => {
    const pending = publishable();
    expect(pending.status).toBe('pending_review');

    expect(() => pending.publish({ by: 'barber-1', role: 'barber', at: AT })).toThrow(
      PortfolioForbiddenError
    );

    const published = pending.publish({ by: 'admin-1', role: 'admin', at: AT });
    expect(published.status).toBe('published');
    expect(published.toView().publishedAt).toEqual(AT);
  });

  it('refuses to publish on a refusal and hides the item immediately', () => {
    const refused = item({
      consent: { opinion: 'no', obtainedVia: 'optin_screen', by: 'client-1', at: AT },
    });

    expect(refused.status).toBe('hidden');
    expect(refused.toView().hiddenReason).toBe('Client declined publication');
    expect(() => refused.publish({ by: 'admin-1', role: 'admin', at: AT })).toThrow(
      PortfolioConflictError
    );
  });

  it('revoking consent hides a published item instantly and keeps the journal', async () => {
    const repository = new InMemoryPortfolioRepository();
    const service = new PortfolioService(repository);
    const created = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'beard',
      after: [afterPhoto()],
      consent: { opinion: 'yes', obtainedVia: 'optin_screen' },
      at: AT,
    });
    await service.publish(created.id, { by: 'admin-1', role: 'admin', at: AT });
    expect(await service.publicGallery('barber-1')).toHaveLength(1);

    const revoked = await service.revokeConsent(created.id, { by: 'client-1', at: AT });

    expect(revoked.status).toBe('hidden');
    expect(revoked.hiddenReason).toBe('Consent revoked');
    expect(await service.publicGallery('barber-1')).toEqual([]);
    expect((await service.consentJournal(created.id)).map((entry) => entry.action)).toEqual([
      'granted',
      'revoked',
    ]);
  });

  it('hides on admin moderation with a reason and rejects client moderation', () => {
    const published = publishable().publish({ by: 'admin-1', role: 'admin', at: AT });

    expect(() =>
      published.hide({ by: 'client-1', role: 'client', reason: 'не хочу', at: AT })
    ).toThrow(PortfolioForbiddenError);
    expect(() => published.hide({ by: 'admin-1', role: 'admin', reason: '  ', at: AT })).toThrow(
      'Hide reason is required'
    );

    const hidden = published.hide({
      by: 'barber-1',
      role: 'barber',
      reason: 'клієнт просив',
      at: AT,
    });
    expect(hidden.status).toBe('hidden');
    expect(hidden.toView().hiddenReason).toBe('клієнт просив');
  });

  it('keeps a before photo or an AI source and requires the AI badge (PRT-001/PRT-007)', () => {
    const pair = item({ before: { url: 'https://cdn.example/before.jpg' } });
    expect(pair.toView().before?.kind).toBe('before');
    expect(pair.toView().aiBadge).toBe(false);

    const ai = item({ before: { url: 'https://cdn.example/ai.jpg', kind: 'ai' } });
    expect(ai.toView().aiBadge).toBe(true);
  });

  it('limits after photos and validates the pair inputs', () => {
    expect(() => item({ after: [] })).toThrow('At least one after photo');
    expect(() =>
      item({ after: Array.from({ length: MAX_AFTER_PHOTOS + 1 }, () => afterPhoto()) })
    ).toThrow(`At most ${MAX_AFTER_PHOTOS}`);
    expect(() => item({ after: [{ url: '   ' }] })).toThrow('Photo url is required');
    expect(statusForConsent(undefined)).toBe('pending_consent');
  });

  it('projects a copy without client identity for the public site', () => {
    const view = publishable().toView();

    expect(JSON.stringify(view)).not.toContain('client-1');
    expect(view.consent).toEqual({ opinion: 'yes', obtainedVia: 'optin_screen', at: AT });
  });
});

describe('PortfolioService moderation queue (T-190)', () => {
  async function seeded() {
    const service = new PortfolioService(new InMemoryPortfolioRepository());
    const waiting = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      after: [afterPhoto('https://cdn.example/1.jpg')],
      consent: { opinion: 'anonymous', obtainedVia: 'optin_screen' },
      at: AT,
    });
    const noConsent = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'beard',
      after: [afterPhoto('https://cdn.example/2.jpg')],
      at: AT,
    });
    const otherBarber = await service.addByBarber({
      actorId: 'barber-2',
      actorRole: 'barber',
      category: 'shave',
      after: [afterPhoto('https://cdn.example/3.jpg')],
      consent: { opinion: 'yes', obtainedVia: 'admin' },
      at: AT,
    });
    return { service, waiting, noConsent, otherBarber };
  }

  it('separates the moderation queue from the barber board', async () => {
    const { service, waiting, noConsent, otherBarber } = await seeded();

    expect((await service.listForAdmin('pending_review')).map((view) => view.id).sort()).toEqual(
      [waiting.id, otherBarber.id].sort()
    );
    expect((await service.listForAdmin('pending_consent')).map((view) => view.id)).toEqual([
      noConsent.id,
    ]);
    expect((await service.listForBarber('barber-1')).map((view) => view.id).sort()).toEqual(
      [waiting.id, noConsent.id].sort()
    );
  });

  it('rejects additions by a client and unknown items', async () => {
    const service = new PortfolioService(new InMemoryPortfolioRepository());

    await expect(
      service.addByBarber({
        actorId: 'client-1',
        actorRole: 'client',
        category: 'haircut',
        after: [afterPhoto()],
        at: AT,
      })
    ).rejects.toBeInstanceOf(PortfolioError);

    await expect(service.publish('missing', { by: 'admin-1', role: 'admin' })).rejects.toThrow(
      'not found'
    );
    await expect(service.consentJournal('missing')).rejects.toThrow('not found');
  });

  it('records consent on an existing item and moves it to review', async () => {
    const { service, noConsent } = await seeded();

    const updated = await service.recordConsent(noConsent.id, {
      actorId: 'client-1',
      actorRole: 'client',
      opinion: 'yes',
      obtainedVia: 'optin_screen',
      at: AT,
    });

    expect(updated.status).toBe('pending_review');
  });
});
