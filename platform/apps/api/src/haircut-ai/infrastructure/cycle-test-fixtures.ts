// Збірка для тестів циклу генерації: in-memory порти + фейк-провайдер.
// Окремим файлом, щоб специфікації не імпортували один в одного (jest реєструє
// describe з імпортованого spec повторно).

import { AiGenerationCycle } from './ai-generation.cycle';
import { FakeAiGenerationGateway } from './fake-ai-generation.gateway';
import {
  InMemoryPhotos,
  InMemoryStorage,
  InMemorySuggestions,
  RecordingOutbox,
  noTransaction,
  testClock,
} from '../application/fakes';

const FAKE_ENV: Record<string, string | undefined> = {
  AI_FAKE_POLLS: '1',
  AI_FAKE_FAIL: undefined,
  AI_FAKE_FAIL_REASON: undefined,
};

export function buildCycle(env: Record<string, string | undefined> = {}) {
  const previous = { ...process.env };
  Object.assign(process.env, FAKE_ENV, env);
  const photos = new InMemoryPhotos();
  const suggestions = new InMemorySuggestions();
  const storage = new InMemoryStorage();
  const outbox = new RecordingOutbox();
  const gateway = new FakeAiGenerationGateway(storage);
  const cycle = new AiGenerationCycle({
    suggestions,
    photos,
    gateway,
    outbox,
    uow: noTransaction,
    clock: testClock,
  });
  return {
    photos,
    suggestions,
    storage,
    outbox,
    gateway,
    cycle,
    restore: () => {
      process.env = previous;
    },
  };
}
