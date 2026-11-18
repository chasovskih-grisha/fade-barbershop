// Типи одного циклу AI-генерації (T-050) — окремо від логіки (гейт max-lines).

import type {
  AiGenerationGateway,
  Clock,
  HaircutSuggestionRepository,
  Outbox,
  SourcePhotoRepository,
  UnitOfWork,
} from '../domain/ports';

export interface AiGenerationCycleDeps {
  suggestions: HaircutSuggestionRepository;
  photos: SourcePhotoRepository;
  gateway: AiGenerationGateway;
  outbox: Outbox;
  uow: UnitOfWork;
  clock: Clock;
}

export interface TickReport {
  submitted: number;
  settled: number;
}
