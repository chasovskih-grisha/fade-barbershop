import { Product } from './product';

describe('Product domain entity (T-270)', () => {
  it('should create product with media CDN photo url', () => {
    const product = Product.create({
      name: 'Pomade',
      description: 'Matte pomade',
      brand: 'FADE',
      category: 'Styling',
      photoUrl: 'https://media.fade.com.ua/products/pomade.jpg',
    });
    expect(product.name).toBe('Pomade');
    expect(product.photoUrl).toContain('media.fade.com.ua');
    expect(product.active).toBe(true);
  });

  it('should reject photo url outside media.fade.com.ua (SHOP-003)', () => {
    expect(() => {
      Product.create({
        name: 'Pomade',
        description: null,
        brand: null,
        category: null,
        photoUrl: 'https://evil.com/pomade.jpg',
      });
    }).toThrow('media.fade.com.ua');
  });

  it('should deactivate product immediately (SHOP-002)', () => {
    const product = Product.create({
      name: 'Pomade',
      description: null,
      brand: null,
      category: null,
      photoUrl: null,
    });
    expect(product.active).toBe(true);
    product.setActive(false);
    expect(product.active).toBe(false);
  });
});
