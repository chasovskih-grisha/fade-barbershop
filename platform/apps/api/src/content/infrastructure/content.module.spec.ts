// T-2300d: попередній перегляд статті — новий контролер і його handler.
// Модуль мусить піднятися без БД і віддати обидва з контейнера: інакше
// /admin/content/articles/:id/preview віддає 500 на першому ж запиті.
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { PreviewArticleHandler } from '../application/preview-article';
import { AdminArticlePreviewController } from './admin-article-preview.controller';
import { ContentModule } from './content.module';

describe('ContentModule wiring (T-2300d)', () => {
  it('резолвить handler і адмінський контролер перегляду', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ContentModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(PreviewArticleHandler)).toBeInstanceOf(PreviewArticleHandler);
    expect(moduleRef.get(AdminArticlePreviewController)).toBeInstanceOf(
      AdminArticlePreviewController
    );

    await moduleRef.close();
  });
});
