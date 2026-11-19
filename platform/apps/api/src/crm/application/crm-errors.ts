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

/** Збережений фільтр (T-4461) не знайдено або він належить іншому власнику. */
export class SavedFilterNotFoundError extends Error {
  constructor(id: string) {
    super(`Saved filter ${id} not found`);
    this.name = 'SavedFilterNotFoundError';
  }
}

/** Дубль назви або перевищена квота збережених фільтрів (T-4461). */
export class SavedFilterConflictError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = 'SavedFilterConflictError';
  }
}
