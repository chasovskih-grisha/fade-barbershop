import { DefaultContentMediaManager } from '../src/index';

describe('ContentMediaManager', () => {
  it('manages barber portfolios, gallery items, and advanced SEO metadata', () => {
    const manager = new DefaultContentMediaManager();
    const portfolio = manager.getBarberPortfolio('barber-1');
    expect(portfolio).not.toBeNull();
    expect(portfolio?.name).toContain('Marcus');
    expect(portfolio?.instagramHandle).toBe('@marcus_fade');

    const updated = manager.updateBarberPortfolio('barber-1', { specialty: 'Master Fade & Hair Stylist' });
    expect(updated.specialty).toBe('Master Fade & Hair Stylist');

    const portfolios = manager.listBarberPortfolios();
    expect(portfolios.length).toBeGreaterThanOrEqual(2);

    const sd = manager.getServiceStructuredData('srv-1');
    expect(sd?.['@type']).toBe('Service');
    expect(sd?.['offers'].price).toBe('55.00');

    const seo = manager.optimizeSeoMetadata('Skin Fade', 'Best skin fade in town with expert barbers.');
    expect(seo.title).toContain('FADE');
    expect(seo.canonicalUrl).toBeDefined();

    const gallery = manager.getGalleryItems('skin-fade');
    expect(gallery.length).toBe(1);
    expect(gallery[0].caption).toContain('High skin fade');

    const newItem = manager.addGalleryItem({
      id: 'gal-3',
      imageUrl: '/images/gallery/fade-3.jpg',
      thumbnailUrl: '/images/gallery/fade-3-thumb.jpg',
      caption: 'Low taper fade',
      barberId: 'barber-1',
      tags: ['taper-fade'],
      likesCount: 50
    });
    expect(newItem.id).toBe('gal-3');
    expect(manager.getGalleryItems('taper-fade').length).toBe(1);
  });
});
