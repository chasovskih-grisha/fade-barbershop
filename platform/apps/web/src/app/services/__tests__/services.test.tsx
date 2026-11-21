import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ServiceCard } from '../ServiceCard';
import type { Service } from '@/lib/api/catalog';

const MOCK_SERVICE: Service = {
  id: 'svc-test-1',
  name: 'Преміум Стрижка',
  duration: 50,
  price: 700,
  description: 'Миття голови, точна форма, гарячий компрес',
};

describe('ServiceCard Component', () => {
  it('renders service details, duration badge, price, and action links', () => {
    render(<ServiceCard service={MOCK_SERVICE} />);

    expect(screen.getByText('Преміум Стрижка')).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes('50') && content.includes('хв'))
    ).toBeInTheDocument();
    expect(screen.getByText('700 ₴')).toBeInTheDocument();
    expect(screen.getByText('Миття голови, точна форма, гарячий компрес')).toBeInTheDocument();

    const bookLink = screen.getByRole('link', { name: 'Записатися' });
    expect(bookLink).toHaveAttribute('href', '/booking');

    const detailsLink = screen.getByRole('link', { name: 'Деталі' });
    expect(detailsLink).toHaveAttribute('href', '/services/svc-test-1');
  });
});
