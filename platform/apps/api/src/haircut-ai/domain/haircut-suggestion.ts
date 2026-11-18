// HaircutSuggestion — одна AI-генерація варіантів зачіски для одного SourcePhoto.
// Статус-машина: pending → processing → ready | failed (термінальні; нова спроба
// = новий рядок, AI-ADM-04). Варіанти живуть у НАШОМУ бакеті (ADR 0008).

import type { GeneratedVariant, GenerationFailureReason, Clock, IdGenerator } from './ports';
import { freshSuggestionState, VARIANT_COUNT_MAX, VARIANT_COUNT_MIN, type HaircutSuggestionProps, type SuggestionStatus } from './haircut-suggestion-props';
import { completeSuggestion, failSuggestion } from './haircut-suggestion-transitions';
import type { SuggestionFailed, SuggestionGenerated } from './events';

export {
  VARIANT_COUNT_MAX,
  VARIANT_COUNT_MIN,
  type HaircutSuggestionProps,
  type SuggestionStatus,
} from './haircut-suggestion-props';

export class HaircutSuggestion {
  private constructor(private readonly props: HaircutSuggestionProps) {}

  static create(input: {
    sourcePhotoId: string;
    ownerId: string;
    variantCount: number;
    clock: Clock;
    ids: IdGenerator;
  }): HaircutSuggestion {
    if (input.variantCount < VARIANT_COUNT_MIN || input.variantCount > VARIANT_COUNT_MAX) {
      throw new Error(
        `variantCount must be ${VARIANT_COUNT_MIN}..${VARIANT_COUNT_MAX} (AI-WEB-04)`
      );
    }
    const now = input.clock.now();
    return new HaircutSuggestion({
      id: input.ids.id(),
      sourcePhotoId: input.sourcePhotoId,
      ownerId: input.ownerId,
      variantCount: input.variantCount,
      ...freshSuggestionState(now),
    });
  }

  static reconstitute(props: HaircutSuggestionProps): HaircutSuggestion {
    return new HaircutSuggestion(props);
  }

  // prettier-ignore
  get id(): string { return this.props.id; }
  // prettier-ignore
  get sourcePhotoId(): string { return this.props.sourcePhotoId; }
  // prettier-ignore
  get ownerId(): string { return this.props.ownerId; }
  // prettier-ignore
  get status(): SuggestionStatus { return this.props.status; }
  // prettier-ignore
  get variants(): GeneratedVariant[] { return [...this.props.variants]; }
  // prettier-ignore
  get providerJobHandle(): string | null { return this.props.providerJobHandle; }
  // prettier-ignore
  get createdAt(): Date { return this.props.createdAt; }
  // prettier-ignore
  get failureReason(): GenerationFailureReason | null { return this.props.failureReason; }
  // prettier-ignore
  get errorMessage(): string | null { return this.props.errorMessage; }
  // prettier-ignore
  get isReady(): boolean { return this.props.status === 'ready'; }
  // prettier-ignore
  get isFailed(): boolean { return this.props.status === 'failed'; }
  // prettier-ignore
  get propsData(): HaircutSuggestionProps { return { ...this.props }; }

  /** pending → processing. Job handle — opaque ідентифікатор провайдера. */
  startProcessing(clock: Clock, providerJobHandle: string): void {
    if (this.props.status !== 'pending')
      throw new Error(`Cannot start processing from ${this.props.status}`);
    this.props.status = 'processing';
    this.props.providerJobHandle = providerJobHandle;
    this.props.updatedAt = clock.now();
  }

  /** processing → ready. Варіанти вже в нашому бакеті. */
  complete(clock: Clock, variants: GeneratedVariant[]): SuggestionGenerated {
    return completeSuggestion(this.props, clock, variants);
  }

  /** pending | processing → failed (термінальний): провайдер міг не прийняти
   *  job з pending — клієнт не має чекати вічного «обробляємо». */
  fail(clock: Clock, reason: GenerationFailureReason, errorMessage?: string): SuggestionFailed {
    // prettier-ignore
    return failSuggestion(this.props, errorMessage === undefined ? { clock, reason } : { clock, reason, errorMessage });
  }
}
