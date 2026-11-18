import { renderReviewHtml, renderReviewSubject, renderReviewText } from './post-visit-review-template';

describe('post-visit-review-template', () => {
  const DATA = {
    clientName: 'Олександр',
    serviceName: 'Haircut',
    barberName: 'Олег',
    feedbackUrl: 'https://fade.app/feedback/123',
    googleReviewUrl: 'https://g.page/r/fade-location',
  };

  it('renders review subject correctly', () => {
    expect(renderReviewSubject(DATA)).toBe('FADE: як пройшов ваш візит, Олександр? ⭐');
  });

  it('renders review text correctly without HTML', () => {
    const text = renderReviewText(DATA);
    expect(text).toContain('Haircut');
    expect(text).toContain('Олег');
    expect(text).not.toContain('<table');
  });

  it('renders review html using primitives', () => {
    const html = renderReviewHtml(DATA);
    expect(html).toContain('Олександр');
    expect(html).toContain('Haircut');
    expect(html).toContain('Олег');
    expect(html).toContain('https://fade.app/feedback/123');
    expect(html).toContain('https://g.page/r/fade-location');
    expect(html).not.toContain('<script');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('drops a non-http review link', () => {
    const html = renderReviewHtml({
      ...DATA,
      feedbackUrl: 'javascript:alert(1)',
    });
    expect(html).not.toContain('javascript:');
    expect(html).toContain('https://g.page/r/fade-location');
  });
});
