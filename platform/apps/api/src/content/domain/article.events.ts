// Доменні події context content (MNG-ADM-17). Імена за конвенцією events
// packages/contracts; outbox-реле читає type + payload (ADR 0009/0016).

export abstract class DomainEvent {
  abstract readonly type: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  abstract readonly payload: Record<string, unknown>;

  constructor(params: { occurredAt: Date; aggregateId: string }) {
    this.occurredAt = params.occurredAt;
    this.aggregateId = params.aggregateId;
  }
}

export type ArticleDraftedProps = {
  id: string;
  slug: string;
  title: string;
  occurredAt: Date;
};

export class ArticleDrafted extends DomainEvent {
  readonly type = 'content.article.drafted';
  readonly payload: { id: string; slug: string; title: string };

  constructor(props: ArticleDraftedProps) {
    super({ occurredAt: props.occurredAt, aggregateId: props.id });
    this.payload = { id: props.id, slug: props.slug, title: props.title };
  }
}

export type ArticlePublishedProps = {
  id: string;
  slug: string;
  publishedAt: Date;
  occurredAt: Date;
};

export class ArticlePublished extends DomainEvent {
  readonly type = 'content.article.published';
  readonly payload: { id: string; slug: string; publishedAt: string };

  constructor(props: ArticlePublishedProps) {
    super({ occurredAt: props.occurredAt, aggregateId: props.id });
    this.payload = {
      id: props.id,
      slug: props.slug,
      publishedAt: props.publishedAt.toISOString(),
    };
  }
}

export type ArticleUnpublishedProps = {
  id: string;
  slug: string;
  occurredAt: Date;
};

export class ArticleUnpublished extends DomainEvent {
  readonly type = 'content.article.unpublished';
  readonly payload: { id: string; slug: string };

  constructor(props: ArticleUnpublishedProps) {
    super({ occurredAt: props.occurredAt, aggregateId: props.id });
    this.payload = { id: props.id, slug: props.slug };
  }
}
