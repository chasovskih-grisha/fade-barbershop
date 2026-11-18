// ArchiveModule (T-4804): холодний архів бронювань + аудит прогонів.
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaArchiveStore } from './prisma-archive.store';
import { FileArchiveUploader } from './file-archive.uploader';
import { ArchiveBookings } from './archive-bookings.use-case';
import { ArchiveWorker } from './archive.worker';
import { ARCHIVE_STORE, ARCHIVE_UPLOADER } from './archive.ports';

@Module({
  providers: [
    PrismaService,
    PrismaArchiveStore,
    { provide: ARCHIVE_STORE, useExisting: PrismaArchiveStore },
    { provide: ARCHIVE_UPLOADER, useFactory: () => new FileArchiveUploader(process.env.ARCHIVE_DIR) },
    {
      provide: ArchiveBookings,
      useFactory: (store, uploader) =>
        new ArchiveBookings({
          store,
          uploader,
          afterMonths: Number(process.env.ARCHIVE_AFTER_MONTHS ?? 24),
        }),
      inject: [ARCHIVE_STORE, ARCHIVE_UPLOADER],
    },
    ArchiveWorker,
  ],
  exports: [ArchiveBookings],
})
export class ArchiveModule {}
