// Регресія на DI-граф контексту: порти (PhotoStorage, Clock, репозиторії) —
// інтерфейси, emitDecoratorMetadata стирає їх до Object, і NestFactory.create
// падає з UnknownDependenciesException. Модуль має резолвити ВСІ use cases,
// воркер і обидва контролери — інакше процес API не піднімається або 500-ить
// перший запит.

import { Test } from '@nestjs/testing';
import { HaircutAiController } from './haircut-ai.controller';
import { HaircutAiGenerationController } from './haircut-ai-generation.controller';
import { HaircutAiModule } from './haircut-ai.module';
import { HaircutAiHandlers } from './haircut-ai-handlers';
import { AiGenerationCycle } from './ai-generation.cycle';
import { AiGenerationWorker } from './ai-generation.worker';
import { FakeAiGenerationGateway } from './fake-ai-generation.gateway';
import { GeminiAiGenerationGateway } from './gemini-ai-generation.gateway';
import { S3PhotoStorage } from './s3-photo-storage';
import {
  UploadPhoto,
  RequestSuggestionHandler,
  GetSuggestionStatusHandler,
  SelectVariantHandler,
  GiveConsentHandler,
  RevokeConsentHandler,
  DeletePhotoHandler,
  ListMyAiHandler,
} from '../application/haircut-ai-use-case.tokens';

describe('HaircutAiModule wiring', () => {
  it('резолвить use cases, воркер і контролери', async () => {
    const moduleRef = await compile();

    for (const token of [
      UploadPhoto,
      RequestSuggestionHandler,
      GetSuggestionStatusHandler,
      SelectVariantHandler,
      GiveConsentHandler,
      RevokeConsentHandler,
      DeletePhotoHandler,
      ListMyAiHandler,
    ]) {
      expect(moduleRef.get(token)).toBeInstanceOf(token);
    }
    expect(moduleRef.get(HaircutAiController)).toBeInstanceOf(HaircutAiController);
    expect(moduleRef.get(HaircutAiGenerationController)).toBeInstanceOf(
      HaircutAiGenerationController
    );
    expect(moduleRef.get(AiGenerationWorker)).toBeInstanceOf(AiGenerationWorker);

    await moduleRef.close();
  });

  it('фейк-провайдер отримує СХОВИЩЕ, а не токен-рядок (був баг T-050)', async () => {
    const moduleRef = await compile();
    const gateway = moduleRef.get(FakeAiGenerationGateway);
    const storage = moduleRef.get(S3PhotoStorage);

    expect(gateway).toBeInstanceOf(FakeAiGenerationGateway);
    expect((gateway as unknown as { storage: unknown }).storage).toBe(storage);

    await moduleRef.close();
  });

  it('контролери отримують той самий бандл use cases (один екземпляр на контекст)', async () => {
    const moduleRef = await compile();
    const bundle = moduleRef.get(HaircutAiHandlers);
    const controller = moduleRef.get(HaircutAiGenerationController) as unknown as {
      handlers: HaircutAiHandlers;
    };

    expect(bundle.useCases.requestSuggestion).toBeInstanceOf(RequestSuggestionHandler);
    expect(controller.handlers).toBe(bundle);

    await moduleRef.close();
  });

  // prettier-ignore
  it.each([['fake', FakeAiGenerationGateway], ['gemini', GeminiAiGenerationGateway]] as const)('AI_PROVIDER=%s підключає відповідний gateway до циклу', async (provider, gatewayCtor) => {
    const previous = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = provider;
    const moduleRef = await compile();
    restoreProvider(previous);

    const cycle = moduleRef.get(AiGenerationCycle) as unknown as { deps: { gateway: unknown } };
    expect(cycle.deps.gateway).toBe(moduleRef.get(gatewayCtor));
    if (provider === 'fake') expect(moduleRef.get(AiGenerationWorker)).toBeInstanceOf(AiGenerationWorker);
    await moduleRef.close();
  });
});

async function compile() {
  return Test.createTestingModule({ imports: [HaircutAiModule] }).compile();
}

function restoreProvider(previous: string | undefined): void {
  if (previous === undefined) delete process.env.AI_PROVIDER;
  else process.env.AI_PROVIDER = previous;
}
