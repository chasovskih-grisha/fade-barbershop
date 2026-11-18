# Холодний архів і партиції (T-4804)

## Що тут

- `partition-plan.ts` — план місячних партицій (`monthlyPartitions`) і
  ідемпотентний DDL (`partitionDdl`). Виконує план ops-крок: перетворення
  `booking` на партиційовану таблицю робиться міграцією з переписуванням.
- `archive-manifest.ts` — ключі обʼєктів (`archive/bookings/YYYY-MM/part-NNNN.json.gz`),
  gzip-кодек і SHA-256.
- `archive-bookings.use-case.ts` — батчі по 500, порядок
  **upload → download+checksum → delete**; збій на будь-якому кроці лишає
  рядки в БД.
- `prisma-archive.store.ts` — вибірка/видалення/пост-перевірка + аудит
  `ArchiveRun` (cutoff, archived, remaining, keys, checksums).
- `file-archive.uploader.ts` — файловий бекенд (`ARCHIVE_DIR`, дефолт
  `var/archive`) за портом `ARCHIVE_UPLOADER`; S3/MinIO-реалізація
  підключається тим самим токеном (SigV4-клієнт — окрема робота).
- `archive.worker.ts` — добовий прогін.

## Конфіг

| Змінна | Типово | Значення |
|--------|--------|----------|
| `ARCHIVE_AFTER_MONTHS` | `24` | скільки місяців бронювання лишаються гарячими |
| `ARCHIVE_INTERVAL_MS` | `86400000` | інтервал прогону; `0` — вимкнути таймер |
| `ARCHIVE_DISABLED` | — | `true` — не стартувати у цьому середовищі |
| `ARCHIVE_DIR` | `var/archive` | корінь файлового архіву (том/бакет) |

У тестах (`NODE_ENV=test`) автостарт вимкнено; ручний прогін —
`ArchiveBookings.execute()`.

## Runbook

1. Міграція `20261218000000_add_archive_run` (таблиця аудиту).
2. Переконатися, що `ARCHIVE_DIR` лежить на томі з бекапом (або підмінити
   uploader на S3/MinIO).
3. Ручний прогін у staging: `ArchiveBookings.execute()` → в аудиті
   `archived > 0`, `remaining = 0`; обʼєкти в каталозі місяця мають ті самі
   SHA-256, що в `checksums`.
4. Партиції: згенерувати `partitionDdl` на 12 місяців уперед і виконати на
   репліці/вікні обслуговування (переписування таблиці блокує записи).

## Не покрито тут

S3/MinIO-клієнт, pg_partman, створення партицій за cron на рівні БД і
навантажувальні тести pruning-у — infra/devops та окремий слайс.
