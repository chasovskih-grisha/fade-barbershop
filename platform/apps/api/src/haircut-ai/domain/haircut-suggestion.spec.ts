// Статус-машина HaircutSuggestion (AI-WEB-01/03): pending → processing →
// ready | failed; термінальні стани не приймають повторних переходів.
// Створення — haircut-suggestion.create.spec.ts.
import { HaircutSuggestion } from './haircut-suggestion';
import type { Clock } from './ports';
import { expectSyncThrow } from '@fade/test-utils';

const NOW = new Date('2026-03-01T10:00:00.000Z');
const LATER = new Date('2026-03-01T11:00:00.000Z');
const clock = (at = NOW): Clock => ({ now: () => at });

const VARIANT = { objectKey: 'v/1.svg', contentType: 'image/svg+xml' };

// prettier-ignore
const newSuggestion = (status: 'pending' | 'processing' = 'pending') =>
  HaircutSuggestion.reconstitute({
    id: 'sug-1', sourcePhotoId: 'photo-1', ownerId: 'user-1', status, variantCount: 3,
    variants: [], failureReason: null, errorMessage: null,
    providerJobHandle: status === 'processing' ? 'job-1' : null,
    createdAt: NOW, updatedAt: NOW, completedAt: null, failedAt: null,
  });

describe('HaircutSuggestion: pending → processing', () => {
  it('startProcessing зберігає job handle провайдера', () => {
    const suggestion = newSuggestion('pending');
    suggestion.startProcessing(clock(LATER), 'job-9');

    expect(suggestion.status).toBe('processing');
    expect(suggestion.providerJobHandle).toBe('job-9');
  });

  it('повторний startProcessing заборонений', () =>
    expectSyncThrow(
      () => newSuggestion('processing').startProcessing(clock(LATER), 'job-9'),
      /Cannot start processing/,
      'обробка вже триває — другий job handle загубив би перший'
    ));
});

describe('HaircutSuggestion: processing → ready', () => {
  it('complete зберігає варіанти і пише SuggestionGenerated', () => {
    const suggestion = newSuggestion('processing');
    const event = suggestion.complete(clock(LATER), [VARIANT, VARIANT]);

    expect(suggestion.isReady).toBe(true);
    expect(suggestion.variants).toHaveLength(2);
    expect(event.type).toBe('haircut-ai.suggestion.generated');
  });

  it('ready — термінальний: повторний complete заборонений', () => {
    const ready = newSuggestion('processing');
    ready.complete(clock(LATER), [VARIANT]);

    expectSyncThrow(
      () => ready.complete(clock(LATER), [VARIANT]),
      /Cannot complete/,
      'готові варіанти не перезаписуються — підміна результату AI'
    );
  });

  it('complete без варіантів — помилка (порожній «результат» не готовий)', () =>
    expectSyncThrow(
      () => newSuggestion('processing').complete(clock(LATER), []),
      /At least one variant/,
      'успіх без жодного варіанта — некоректний стан ready'
    ));
});

describe('HaircutSuggestion: failed', () => {
  it('processing → failed зберігає причину і пише SuggestionFailed', () => {
    const suggestion = newSuggestion('processing');
    const event = suggestion.fail(clock(LATER), 'provider_quota', 'черга переповнена');

    expect(suggestion.isFailed).toBe(true);
    expect(suggestion.failureReason).toBe('provider_quota');
    expect(suggestion.errorMessage).toBe('черга переповнена');
    expect(event.type).toBe('haircut-ai.suggestion.failed');
  });

  it('pending → failed: провайдер не прийняв job (не зависаємо в processing)', () => {
    const suggestion = newSuggestion('pending');
    suggestion.fail(clock(LATER), 'unknown', 'submit не вдався');

    expect(suggestion.isFailed).toBe(true);
  });

  it.each(['ready', 'failed'] as const)('%s — термінальний для повторного fail', (terminal) => {
    const suggestion = newSuggestion('processing');
    if (terminal === 'ready') suggestion.complete(clock(LATER), [VARIANT]);
    else suggestion.fail(clock(LATER), 'unknown');

    expectSyncThrow(
      () => suggestion.fail(clock(LATER), 'unknown'),
      /Cannot fail/,
      `${terminal} не змінюється на failed заднім числом`
    );
  });
});
