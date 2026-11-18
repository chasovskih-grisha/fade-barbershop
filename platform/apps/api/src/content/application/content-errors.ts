// Помилки use cases context content. Код мапається на HTTP у контролері.

export class ContentError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ContentError';
  }
}

/** Статті з таким slug уже немає (MNG-ADM-17: унікальний URL публікації). */
export class ArticleSlugTakenError extends ContentError {
  constructor() {
    super('ARTICLE_SLUG_TAKEN', 'Article slug already taken');
  }
}

export class ArticleNotFoundError extends ContentError {
  constructor() {
    super('ARTICLE_NOT_FOUND', 'Article not found');
  }
}

/** Порожній/непридатний вміст: заголовок, текст, slug. */
export class InvalidArticleInputError extends ContentError {
  constructor(message: string) {
    super('INVALID_ARTICLE_INPUT', message);
  }
}
