export interface FaqItem {
  question: string;
  answer: string;
}

export interface SeoBlockProps {
  id: string;
  entityType: string;
  entityId: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  faq: FaqItem[];
  updatedAt: Date;
}

export class SeoBlock {
  constructor(private readonly props: SeoBlockProps) {
    if (props.title && props.title.length > 70) {
      throw new Error('SEO title cannot exceed 70 characters');
    }
    if (props.metaDescription && props.metaDescription.length > 160) {
      throw new Error('SEO meta description cannot exceed 160 characters');
    }
    if (props.h1 && props.h1.length > 100) {
      throw new Error('SEO H1 cannot exceed 100 characters');
    }
  }

  get id(): string { return this.props.id; }
  get entityType(): string { return this.props.entityType; }
  get entityId(): string { return this.props.entityId; }
  get title(): string | null { return this.props.title; }
  get metaDescription(): string | null { return this.props.metaDescription; }
  get h1(): string | null { return this.props.h1; }
  get faq(): FaqItem[] { return this.props.faq; }
  get updatedAt(): Date { return this.props.updatedAt; }

  toDto() {
    return {
      id: this.props.id,
      entityType: this.props.entityType,
      entityId: this.props.entityId,
      title: this.props.title,
      metaDescription: this.props.metaDescription,
      h1: this.props.h1,
      faq: this.props.faq,
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
