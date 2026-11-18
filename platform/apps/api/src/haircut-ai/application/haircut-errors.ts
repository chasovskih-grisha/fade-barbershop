// Винятки haircut-ai (Supporting, ADR 0008). Клієнту не віддаємо сирі рядки
// провайдера — лише машиночитний код (HaircutExceptionFilter мапить на HTTP).

export class SourcePhotoNotFoundError extends Error {
  constructor(id: string) {
    super(`Фото ${id} не знайдено`);
    this.name = 'SourcePhotoNotFoundError';
  }
}

export class SuggestionNotFoundError extends Error {
  constructor(id: string) {
    super(`Генерація ${id} не знайдена`);
    this.name = 'SuggestionNotFoundError';
  }
}

export class VariantNotFoundError extends Error {
  constructor(objectKey: string) {
    super(`Варіант ${objectKey} не належить цій генерації`);
    this.name = 'VariantNotFoundError';
  }
}

/** Згода на AI-обробку не надана (AI-WEB-02) або вже відкликана (AI-WEB-07). */
export class ConsentRequiredError extends Error {
  constructor() {
    super('Потрібна згода на обробку фото штучним інтелектом');
    this.name = 'ConsentRequiredError';
  }
}

/** Денний ліміт 3 генерації вичерпано (AI-WEB-05, AI-ADM-03). */
export class GenerationLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationLimitExceededError';
  }
}

export class PhotoAlreadyDeletedError extends Error {
  constructor() {
    super('Фото вже видалено');
    this.name = 'PhotoAlreadyDeletedError';
  }
}

/** Дія недопустима в поточному статусі генерації (напр. вибір до ready). */
export class InvalidGenerationStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGenerationStatusError';
  }
}
