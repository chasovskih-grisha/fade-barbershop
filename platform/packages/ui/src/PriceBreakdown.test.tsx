import { render, screen } from '@testing-library/react';
import { PriceBreakdown } from './PriceBreakdown';

describe('PriceBreakdown', () => {
  it('показує послугу і підсумок у фінальному рядку', () => {
    render(<PriceBreakdown service={{ label: 'Стрижка', amount: 600 }} finalAmount={600} />);
    expect(screen.getByText('Стрижка')).toBeTruthy();
    const final = screen.getByText('Разом').nextElementSibling;
    expect(final?.textContent).toContain('₴');
  });

  it('показує кожну знижку окремим рядком', () => {
    render(
      <PriceBreakdown
        service={{ label: 'Стрижка', amount: 600 }}
        discounts={[
          { label: 'Знижка 10%', amount: 60 },
          { label: 'Сертифікат', amount: 100 },
        ]}
        finalAmount={440}
      />
    );
    expect(screen.getByText('Знижка 10%')).toBeTruthy();
    expect(screen.getByText('Сертифікат')).toBeTruthy();
  });

  it('без знижок показує лише послугу і підсумок', () => {
    render(<PriceBreakdown service={{ label: 'Стрижка', amount: 600 }} finalAmount={600} />);
    expect(screen.getByText('Разом')).toBeTruthy();
  });
});
