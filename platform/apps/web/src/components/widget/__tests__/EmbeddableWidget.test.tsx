import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmbeddableWidget } from '../EmbeddableWidget';

describe('EmbeddableWidget', () => {
  it('renders iframe with correct embed parameters and handles loading state', () => {
    render(
      <EmbeddableWidget
        shopId="shop-123"
        serviceId="srv-456"
        barberId="barber-789"
        primaryColor="accent"
        theme="dark"
      />
    );

    expect(screen.getByText('Loading FADE Booking Widget...')).toBeDefined();

    const iframe = screen.getByTitle('FADE Booking Widget') as HTMLIFrameElement;
    expect(iframe).toBeDefined();
    expect(iframe.src).toContain('embed=true');
    expect(iframe.src).toContain('shop=shop-123');
    expect(iframe.src).toContain('service=srv-456');
    expect(iframe.src).toContain('barber=barber-789');
    expect(iframe.src).toContain('theme=dark');
    expect(iframe.src).toContain('primaryColor=accent');
  });
});
