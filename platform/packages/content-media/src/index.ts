export interface BarberPortfolio {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  portfolioImages: string[];
  instagramHandle?: string;
  rating?: number;
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
    canonicalUrl?: string;
  };
}

export interface ServiceDescription {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  priceUsd: number;
  tags?: string[];
  structuredDataJsonLd: Record<string, any>;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
  barberId: string;
  tags: string[];
  likesCount: number;
}

export interface ContentMediaManager {
  getBarberPortfolio(barberId: string): BarberPortfolio | null;
  updateBarberPortfolio(barberId: string, updates: Partial<BarberPortfolio>): BarberPortfolio;
  listBarberPortfolios(): BarberPortfolio[];
  getServiceStructuredData(serviceId: string): Record<string, any> | null;
  optimizeSeoMetadata(pageTitle: string, description: string): { title: string; description: string; ogImage: string; canonicalUrl: string };
  getGalleryItems(tag?: string): GalleryItem[];
  addGalleryItem(item: GalleryItem): GalleryItem;
}

export class DefaultContentMediaManager implements ContentMediaManager {
  private portfolios: Map<string, BarberPortfolio> = new Map([
    ['barber-1', {
      id: 'barber-1',
      name: 'Marcus "Fade" Vance',
      specialty: 'Master Barber & Skin Fade Specialist',
      bio: 'Over 10 years crafting precision fades and classic gentleman grooming in downtown FADE.',
      portfolioImages: ['/images/portfolios/marcus-1.jpg', '/images/portfolios/marcus-2.jpg'],
      instagramHandle: '@marcus_fade',
      rating: 4.98,
      seoMetadata: {
        title: 'Marcus Vance - Master Barber at FADE',
        description: 'Book precision skin fades and luxury beard trims with Marcus Vance at FADE barbershop.',
        keywords: ['skin fade', 'barber downtown', 'beard trim', 'Marcus Vance'],
        canonicalUrl: 'https://fadebarbershop.com/barbers/marcus-vance'
      }
    }],
    ['barber-2', {
      id: 'barber-2',
      name: 'Elena "Blade" Rostova',
      specialty: 'Modern Crop & Scissor Cut Expert',
      bio: 'Precision textured crops, contemporary styling, and meticulous razor work.',
      portfolioImages: ['/images/portfolios/elena-1.jpg'],
      instagramHandle: '@elena_cuts',
      rating: 4.95,
      seoMetadata: {
        title: 'Elena Rostova - Stylist Barber at FADE',
        description: 'Book modern crops and scissor styling with Elena Rostova at FADE.',
        keywords: ['textured crop', 'scissor cut', 'Elena Rostova'],
        canonicalUrl: 'https://fadebarbershop.com/barbers/elena-rostova'
      }
    }]
  ]);

  private services: Map<string, ServiceDescription> = new Map([
    ['srv-1', {
      id: 'srv-1',
      title: 'Signature FADE Haircut & Beard Grooming',
      category: 'Hair & Beard',
      durationMinutes: 45,
      priceUsd: 55,
      tags: ['bestseller', 'skin-fade', 'hot-towel'],
      structuredDataJsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Signature FADE Haircut & Beard Grooming',
        'provider': {
          '@type': 'LocalBusiness',
          'name': 'FADE Barbershop'
        },
        'offers': {
          '@type': 'Offer',
          'price': '55.00',
          'priceCurrency': 'USD'
        },
        'description': 'Precision haircut tailored to your head shape, finished with hot towel and razor neck cleanup.'
      }
    }],
    ['srv-2', {
      id: 'srv-2',
      title: 'Executive Hot Towel Shave',
      category: 'Shave',
      durationMinutes: 30,
      priceUsd: 40,
      tags: ['shave', 'hot-towel', 'luxury'],
      structuredDataJsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Executive Hot Towel Shave',
        'provider': {
          '@type': 'LocalBusiness',
          'name': 'FADE Barbershop'
        },
        'offers': {
          '@type': 'Offer',
          'price': '40.00',
          'priceCurrency': 'USD'
        },
        'description': 'Traditional straight razor shave with pre-shave oils and multiple hot steam towels.'
      }
    }]
  ]);

  private gallery: GalleryItem[] = [
    {
      id: 'gal-1',
      imageUrl: '/images/gallery/fade-1.jpg',
      thumbnailUrl: '/images/gallery/fade-1-thumb.jpg',
      caption: 'High skin fade with textured crop on top.',
      barberId: 'barber-1',
      tags: ['skin-fade', 'crop', 'bestseller'],
      likesCount: 142
    },
    {
      id: 'gal-2',
      imageUrl: '/images/gallery/shave-1.jpg',
      thumbnailUrl: '/images/gallery/shave-1-thumb.jpg',
      caption: 'Straight razor hot towel cleanup.',
      barberId: 'barber-2',
      tags: ['shave', 'hot-towel'],
      likesCount: 98
    }
  ];

  getBarberPortfolio(barberId: string): BarberPortfolio | null {
    return this.portfolios.get(barberId) || null;
  }

  listBarberPortfolios(): BarberPortfolio[] {
    return Array.from(this.portfolios.values());
  }

  updateBarberPortfolio(barberId: string, updates: Partial<BarberPortfolio>): BarberPortfolio {
    let existing = this.portfolios.get(barberId);
    if (!existing) {
      existing = {
        id: barberId,
        name: 'New Barber',
        specialty: 'Stylist',
        bio: '',
        portfolioImages: [],
        seoMetadata: { title: '', description: '', keywords: [] }
      };
    }
    const updated = { ...existing, ...updates };
    this.portfolios.set(barberId, updated);
    return updated;
  }

  getServiceStructuredData(serviceId: string): Record<string, any> | null {
    const service = this.services.get(serviceId);
    return service ? service.structuredDataJsonLd : null;
  }

  optimizeSeoMetadata(pageTitle: string, description: string): { title: string; description: string; ogImage: string; canonicalUrl: string } {
    const cleanTitle = pageTitle.includes('FADE') ? pageTitle : `${pageTitle} | FADE Barbershop Platform`;
    const cleanDesc = description.length > 160 ? description.substring(0, 157) + '...' : description;
    return {
      title: cleanTitle,
      description: cleanDesc,
      ogImage: 'https://fadebarbershop.com/og-default.jpg',
      canonicalUrl: 'https://fadebarbershop.com/' + pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
  }

  getGalleryItems(tag?: string): GalleryItem[] {
    if (!tag) return this.gallery;
    return this.gallery.filter(item => item.tags.includes(tag));
  }

  addGalleryItem(item: GalleryItem): GalleryItem {
    this.gallery.push(item);
    return item;
  }
}
