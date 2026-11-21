import { SeoBlock } from './seo-block';

describe('SeoBlock Domain', () => {
  it('creates valid seo block', () => {
    const block = new SeoBlock({
      id: 'seo-1',
      entityType: 'article',
      entityId: 'art-1',
      title: 'Valid Title',
      metaDescription: 'Valid description under 160 characters.',
      h1: 'Valid H1',
      faq: [{ question: 'Q1', answer: 'A1' }],
      updatedAt: new Date(),
    });

    expect(block.title).toBe('Valid Title');
    expect(block.faq).toHaveLength(1);
  });

  it('throws error if title exceeds 70 characters', () => {
    expect(
      () =>
        new SeoBlock({
          id: 'seo-1',
          entityType: 'article',
          entityId: 'art-1',
          title: 'A'.repeat(71),
          metaDescription: null,
          h1: null,
          faq: [],
          updatedAt: new Date(),
        })
    ).toThrow('SEO title cannot exceed 70 characters');
  });

  it('throws error if metaDescription exceeds 160 characters', () => {
    expect(
      () =>
        new SeoBlock({
          id: 'seo-1',
          entityType: 'article',
          entityId: 'art-1',
          title: 'Title',
          metaDescription: 'A'.repeat(161),
          h1: null,
          faq: [],
          updatedAt: new Date(),
        })
    ).toThrow('SEO meta description cannot exceed 160 characters');
  });
});
