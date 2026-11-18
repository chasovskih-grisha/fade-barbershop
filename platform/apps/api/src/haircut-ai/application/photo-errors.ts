// Помилки haircut-ai — доменні/аплікаційні, контролер перекладає їх у HTTP.

/** Фото не пройшло валідацію (формат, розмір) — REF-WEB-05. */
export class InvalidPhotoError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidPhotoError';
  }
}
