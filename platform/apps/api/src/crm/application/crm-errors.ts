export class ClientProfileNotFoundError extends Error {
  constructor(id: string) {
    super(`Client profile ${id} not found`);
    this.name = 'ClientProfileNotFoundError';
  }
}

export class PreferenceNotFoundError extends Error {
  constructor(id: string) {
    super(`Preference ${id} not found`);
    this.name = 'PreferenceNotFoundError';
  }
}

/** Неприпустимий запит списку клієнтів (T-4606a) — HTTP 400 у фільтрі. */
export class InvalidClientListQueryError extends Error {
  constructor(detail: string) {
    super(`Invalid client list query: ${detail}`);
    this.name = 'InvalidClientListQueryError';
  }
}

export class NoteNotFoundError extends Error {
  constructor(id: string) {
    super(`Note ${id} not found`);
    this.name = 'NoteNotFoundError';
  }
}

/** Помилка: спроба зберегти фільтр з уже існуючою назвою у тому ж власнику. */
export class SavedFilterConflictError extends Error {
  constructor(detail: string) {
    super(`Saved filter conflict: ${detail}`);
    this.name = 'SavedFilterConflictError';
  }
}

/** Помилка: фільтр не знайдено. */
export class SavedFilterNotFoundError extends Error {
  constructor(id: string) {
    super(`Saved filter ${id} not found`);
    this.name = 'SavedFilterNotFoundError';
  }
}
