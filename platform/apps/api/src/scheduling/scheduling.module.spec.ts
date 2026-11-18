// Регресія на DI-граф календаря (патерн haircut-ai.module.spec): порт
// ReferencePhotoUrls — інтерфейс, emitDecoratorMetadata стирає його до Object,
// тож Nest резолвить залежність лише через явну фабрику. Модуль має піднятися
// без БД — інакше перший же GET /admin/calendar падає 500-ю.
import { Test } from '@nestjs/testing';
import { SchedulingModule } from './scheduling.module';
import { AdminCalendar } from './application/admin-calendar';
import { HaircutAiReferencePhotoUrls } from './infrastructure/reference-photo-urls.adapter';

describe('SchedulingModule wiring', () => {
  it('резолвить AdminCalendar разом із підписувачем референсів', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SchedulingModule] }).compile();

    expect(moduleRef.get(AdminCalendar)).toBeInstanceOf(AdminCalendar);
    expect(moduleRef.get(HaircutAiReferencePhotoUrls)).toBeInstanceOf(HaircutAiReferencePhotoUrls);

    await moduleRef.close();
  });
});
