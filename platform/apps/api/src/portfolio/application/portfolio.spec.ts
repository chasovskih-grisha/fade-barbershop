// Специфікація T-4455: барбер додає фото «до/після» з пристрою, фіксує згоду
// клієнта, адмін модерує; відкликання згоди ховає елемент негайно.
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PortfolioConflictError,
  PortfolioError,
  PortfolioForbiddenError,
  addPortfolioItem,
  hidePortfolioItem,
  normalizePortfolioTags,
  publishPortfolioItem,
  recordClientConsent,
  revokeClientConsent,
  type ClientConsent,
  type PortfolioItem,
} from '../domain/portfolio-item';
import {
  InMemoryPortfolioConsentJournal,
  InMemoryPortfolioRepository,
  PortfolioService,
} from './portfolio.service';
import {
  AdminPortfolioController,
  BarberPortfolioController,
  PublicPortfolioController,
} from '../infrastructure/portfolio.controller';

const NOW = new Date('2026-11-19T12:00:00Z');

const PHOTO = { objectKey: 'portfolio/after-1.jpg', alt: 'Fade зверху' };

function consent(overrides: Partial<ClientConsent> = {}): ClientConsent {
  return {
    opinion: 'named',
    obtainedVia: 'opt_in_screen',
    by: 'barber-1',
    at: NOW,
    ...overrides,
  };
}

function item(overrides: Partial<PortfolioItem> = {}): PortfolioItem {
  return {
    ...addPortfolioItem({
      id: 'item-1',
      barberId: 'barber-1',
      category: 'haircut',
      after: [PHOTO],
      at: NOW,
    }),
    ...overrides,
  };
}

describe('portfolio domain (T-4455)', () => {
  it('requires an after photo, a known category and a photo key', () => {
    expect(() =>
      addPortfolioItem({
        id: 'i-1',
        barberId: 'b-1',
        category: 'haircut',
        after: [],
        at: NOW,
      })
    ).toThrow('At least one after photo');

    expect(() =>
      addPortfolioItem({
        id: 'i-1',
        barberId: 'b-1',
        category: 'shave',
        after: [PHOTO],
        at: NOW,
      })
    ).toThrow('Unknown portfolio category');

    expect(() =>
      addPortfolioItem({
        id: 'i-1',
        barberId: 'b-1',
        category: 'beard',
        after: [{ objectKey: '  ' }],
        at: NOW,
      })
    ).toThrow('object key');

    expect(() =>
      addPortfolioItem({
        id: 'i-1',
        barberId: 'b-1',
        category: 'beard',
        after: Array.from({ length: 5 }, (_, index) => ({
          objectKey: `p-${index}.jpg`,
        })),
        at: NOW,
      })
    ).toThrow('At most 4 after photos');
  });

  it('normalizes tags: lowercase, without #, unique and limited to five', () => {
    expect(normalizePortfolioTags(['#Fade', ' fade ', 'Beard', 'BEARD'])).toEqual([
      'fade',
      'beard',
    ]);
    expect(() => normalizePortfolioTags(['a', 'b', 'c', 'd', 'e', 'f'])).toThrow('At most 5');
    expect(() => normalizePortfolioTags(['x'.repeat(25)])).toThrow('longer than 24');
  });

  it('keeps an item without consent in pending_consent and never publishes it', () => {
    const draft = item();
    expect(draft.status).toBe('pending_consent');
    expect(draft.caption).toBeNull();

    expect(() => publishPortfolioItem(draft, { by: 'admin-1', role: 'admin', at: NOW })).toThrow(
      PortfolioConflictError
    );
  });

  it('moves to pending_review once consent is recorded and downgrades in-chair named consent', () => {
    const withConsent = recordClientConsent(item(), consent());
    expect(withConsent.status).toBe('pending_review');

    const inChair = recordClientConsent(
      item(),
      consent({ obtainedVia: 'in_chair', opinion: 'named' })
    );
    expect(inChair.consent?.opinion).toBe('anonymous');

    const refused = recordClientConsent(item(), consent({ opinion: 'none' }));
    expect(refused.status).toBe('pending_consent');
  });

  it('publishes only from pending_review, only for an admin, and only once', () => {
    const ready = recordClientConsent(item(), consent());

    expect(() =>
      publishPortfolioItem(ready, { by: 'barber-1', role: 'barber', at: NOW })
    ).toThrow(PortfolioForbiddenError);

    const published = publishPortfolioItem(ready, { by: 'admin-1', role: 'admin', at: NOW });
    expect(published.status).toBe('published');
    expect(published.publishedAt).toEqual(NOW);

    expect(() =>
      publishPortfolioItem(published, { by: 'admin-1', role: 'admin', at: NOW })
    ).toThrow('already published');

    expect(() =>
      publishPortfolioItem(
        { ...item(), consent: consent(), status: 'pending_consent' },
        { by: 'admin-1', role: 'admin', at: NOW }
      )
    ).toThrow('Cannot publish an item in status pending_consent');
  });

  it('hides on admin request with a reason and is idempotent', () => {
    const published = publishPortfolioItem(recordClientConsent(item(), consent()), {
      by: 'admin-1',
      role: 'admin',
      at: NOW,
    });

    expect(() =>
      hidePortfolioItem(published, { by: 'barber-1', role: 'barber', reason: 'x', at: NOW })
    ).toThrow(PortfolioForbiddenError);
    expect(() =>
      hidePortfolioItem(published, { by: 'admin-1', role: 'admin', reason: '  ', at: NOW })
    ).toThrow('Hide reason');

    const hidden = hidePortfolioItem(published, {
      by: 'admin-1',
      role: 'admin',
      reason: 'client asked',
      at: NOW,
    });
    expect(hidden.status).toBe('hidden');
    expect(hidden.hiddenReason).toBe('client asked');
    expect(
      hidePortfolioItem(hidden, { by: 'admin-1', role: 'admin', reason: 'again', at: NOW })
    ).toBe(hidden);
  });

  it('revoking consent hides immediately and blocks a later publish', () => {
    const published = publishPortfolioItem(recordClientConsent(item(), consent()), {
      by: 'admin-1',
      role: 'admin',
      at: NOW,
    });

    const revoked = revokeClientConsent(published, { by: 'client-1', at: NOW });
    expect(revoked.status).toBe('hidden');
    expect(revoked.hiddenReason).toBe('client_consent_revoked');
    expect(revoked.consent?.revokedAt).toEqual(NOW);

    expect(() =>
      publishPortfolioItem(revoked, { by: 'admin-1', role: 'admin', at: NOW })
    ).toThrow(PortfolioConflictError);

    expect(() => revokeClientConsent(item(), { by: 'client-1', at: NOW })).toThrow(
      'no consent'
    );
  });
});

describe('PortfolioService (T-4455)', () => {
  function setup() {
    const repository = new InMemoryPortfolioRepository();
    const journal = new InMemoryPortfolioConsentJournal();
    const service = new PortfolioService(repository, journal, { now: () => NOW });
    return { repository, journal, service };
  }

  it('adds an item with a generated uuid and pending_consent status', async () => {
    const { service } = setup();
    const view = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'beard',
      caption: '  Борода  ',
      tags: ['#BEARD'],
      after: [PHOTO],
    });

    expect(view.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-/);
    expect(view.barberId).toBe('barber-1');
    expect(view.caption).toBe('Борода');
    expect(view.tags).toEqual(['beard']);
    expect(view.status).toBe('pending_consent');
    expect(view.hasConsent).toBe(false);
  });

  it('forbids a barber from adding to another barber and unknown roles', async () => {
    const { service } = setup();
    await expect(
      service.addByBarber({
        actorId: 'barber-1',
        actorRole: 'barber',
        barberId: 'barber-2',
        category: 'haircut',
        after: [PHOTO],
      })
    ).rejects.toThrow(PortfolioForbiddenError);

    await expect(
      service.addByBarber({
        actorId: 'client-1',
        actorRole: 'client',
        category: 'haircut',
        after: [PHOTO],
      })
    ).rejects.toThrow(PortfolioForbiddenError);
  });

  it('records consent in the journal with actor and time', async () => {
    const { service } = setup();
    const added = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      after: [PHOTO],
    });

    const withConsent = await service.recordConsent(added.id, {
      actorId: 'barber-1',
      actorRole: 'barber',
      opinion: 'named',
      obtainedVia: 'opt_in_screen',
    });
    expect(withConsent.status).toBe('pending_review');
    expect(withConsent.hasConsent).toBe(true);

    const journal = service.consentJournal(added.id);
    expect(journal).toEqual([
      {
        itemId: added.id,
        barberId: 'barber-1',
        opinion: 'named',
        obtainedVia: 'opt_in_screen',
        by: 'barber-1',
        at: NOW,
        action: 'recorded',
      },
    ]);

    const revoked = await service.revokeConsent(added.id, { by: 'client-1' });
    expect(revoked.status).toBe('hidden');
    expect(service.consentJournal(added.id).map((entry) => entry.action)).toEqual([
      'recorded',
      'revoked',
    ]);
  });

  it('serves the barber list, the moderation queue and the public gallery', async () => {
    const { service } = setup();
    const first = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      after: [PHOTO],
      consent: { opinion: 'named', obtainedVia: 'opt_in_screen' },
    });
    await service.addByBarber({
      actorId: 'barber-2',
      actorRole: 'barber',
      category: 'beard',
      after: [PHOTO],
    });
    await service.publish(first.id, { by: 'admin-1', role: 'admin' });

    expect((await service.listForBarber('barber-1')).map((view) => view.status)).toEqual([
      'published',
    ]);
    expect(await service.listForAdmin('pending_consent')).toHaveLength(1);
    expect(await service.listForAdmin()).toHaveLength(2);
    expect((await service.publicGallery('barber-1')).map((view) => view.id)).toEqual([first.id]);
    expect(await service.publicGallery('barber-2')).toEqual([]);
  });

  it('reports a missing item and refuses a barber recording consent on a foreign item', async () => {
    const { service } = setup();
    await expect(service.publish('missing', { by: 'admin-1', role: 'admin' })).rejects.toThrow(
      'not found'
    );

    const added = await service.addByBarber({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      after: [PHOTO],
    });
    await expect(
      service.recordConsent(added.id, {
        actorId: 'barber-2',
        actorRole: 'barber',
        opinion: 'named',
        obtainedVia: 'in_chair',
      })
    ).rejects.toThrow(PortfolioForbiddenError);
  });
});

describe('portfolio controllers (T-4455)', () => {
  function setup() {
    const repository = new InMemoryPortfolioRepository();
    const journal = new InMemoryPortfolioConsentJournal();
    const service = new PortfolioService(repository, journal, { now: () => NOW });
    return {
      barber: new BarberPortfolioController(service),
      admin: new AdminPortfolioController(service),
      publicBoard: new PublicPortfolioController(service),
    };
  }

  it('serves upload, consent, publish, gallery, hide and the consent journal', async () => {
    const { barber, admin, publicBoard } = setup();

    const added = await barber.add({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      tags: ['fade'],
      after: [PHOTO],
      at: NOW.toISOString(),
    });
    expect(added.status).toBe('pending_consent');

    await barber.consent(added.id, {
      actorId: 'barber-1',
      actorRole: 'barber',
      opinion: 'anonymous',
      obtainedVia: 'in_chair',
      at: NOW.toISOString(),
    });

    const published = await admin.publish(added.id, {
      by: 'admin-1',
      role: 'admin',
      at: NOW.toISOString(),
    });
    expect(published.status).toBe('published');
    expect(await publicBoard.gallery('barber-1')).toHaveLength(1);

    expect(admin.journal(added.id).map((entry) => entry.opinion)).toEqual(['anonymous']);

    const hidden = await admin.hide(added.id, {
      by: 'admin-1',
      role: 'admin',
      reason: 'blur',
      at: NOW.toISOString(),
    });
    expect(hidden.hiddenReason).toBe('blur');
    expect(await publicBoard.gallery('barber-1')).toEqual([]);
  });

  it('maps forbidden, conflict, not-found and bad input to HTTP errors', async () => {
    const { barber, admin } = setup();
    const added = await barber.add({
      actorId: 'barber-1',
      actorRole: 'barber',
      category: 'haircut',
      after: [PHOTO],
    });

    await expect(admin.publish(added.id, { by: 'barber-1', role: 'barber' })).rejects.toThrow(
      ForbiddenException
    );
    await expect(admin.publish(added.id, { by: 'admin-1', role: 'admin' })).rejects.toThrow(
      ConflictException
    );
    await expect(admin.hide('missing', { by: 'admin-1', role: 'admin', reason: 'x' })).rejects.toThrow(
      NotFoundException
    );
    await expect(
      barber.add({ actorId: 'barber-1', actorRole: 'owner', category: 'haircut', after: [PHOTO] })
    ).rejects.toThrow(BadRequestException);
    await expect(
      barber.add({ actorId: 'barber-1', actorRole: 'barber', category: 'shave', after: [PHOTO] })
    ).rejects.toThrow(BadRequestException);
  });
});
