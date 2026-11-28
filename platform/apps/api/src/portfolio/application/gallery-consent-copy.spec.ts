// T-6006: специфікація текстів згоди — три сценарії (публічно / анонімно / відмова)
// і два повідомлення модерації (PRT-002, PRT-ADM-03).
import type { ConsentOpinion, PublicationStatus } from '../domain/portfolio-item';
import {
  CONSENT_PUSH,
  CONSENT_SCREEN,
  consentOption,
  publicationNotice,
} from './gallery-consent-copy';

describe('GalleryConsentCopy: запит згоди', () => {
  it('push після візиту називає обидва формати публікації', () => {
    expect(CONSENT_PUSH.title).toBe('Опублікувати фото вашої нової зачіски?');
    expect(CONSENT_PUSH.body).toContain('публічно');
    expect(CONSENT_PUSH.body).toContain('анонімно');
  });

  it('публічно → кнопка обіцяє ім’я, не безіменний профіль', () => {
    const option = consentOption('yes');

    expect(option?.label).toBe('Надати згоду (публічно)');
    expect(option?.detail).toContain('імені');
  });

  it('анонімно → кнопка обіцяє приховане обличчя', () => {
    const option = consentOption('anonymous');

    expect(option?.label).toBe('Надати згоду (анонімно)');
    expect(option?.detail).toContain('Обличчя');
    expect(option?.detail).toContain('приховано');
  });

  it('відмова → фото лишається приватним і не потрапляє в галерею', () => {
    const option = consentOption('no');

    expect(option?.label).toBe('Відмовитися');
    expect(option?.detail).toContain('приватним');
    expect(option?.detail).toContain('не з’явиться');
  });

  it('екран описує кожен доменний варіант рівно один раз', () => {
    const opinions = CONSENT_SCREEN.options.map((option) => option.opinion);
    const uniqueLabels = new Set(CONSENT_SCREEN.options.map((option) => option.label));

    expect(opinions).toEqual<ConsentOpinion[]>(['yes', 'anonymous', 'no']);
    expect(uniqueLabels.size).toBe(opinions.length);
  });
});

describe('GalleryConsentCopy: модерація', () => {
  it('опубліковано → подяка клієнту', () => {
    expect(publicationNotice('published')?.body).toContain('успішно опубліковано');
  });

  it('приховано → пояснення, фото лишається приватним', () => {
    expect(publicationNotice('hidden')?.body).toContain('залишається приватним');
  });

  it.each<PublicationStatus>(['pending_consent', 'pending_review'])(
    '%s → клієнту нічого не пишемо',
    (status) => {
      expect(publicationNotice(status)).toBeUndefined();
    }
  );
});
