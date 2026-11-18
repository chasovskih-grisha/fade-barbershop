'use client';

import React, { useState, useEffect } from 'react';

export interface EmbeddableWidgetProps {
  shopId: string;
  serviceId?: string;
  barberId?: string;
  width?: string | number;
  height?: string | number;
  primaryColor?: string;
  theme?: 'light' | 'dark';
  onBookingComplete?: (bookingId: string) => void;
}

export const EmbeddableWidget: React.FC<EmbeddableWidgetProps> = ({
  shopId,
  serviceId,
  barberId,
  width = '100%',
  height = '600px',
  primaryColor = 'var(--color-lightTheme-ink)',
  theme = 'light',
  onBookingComplete,
}) => {
  const [loading, setLoading] = useState(true);

  // Construct iframe src with deep link parameters
  const params = new URLSearchParams({
    embed: 'true',
    shop: shopId,
    ...(serviceId ? { service: serviceId } : {}),
    ...(barberId ? { barber: barberId } : {}),
    theme,
    primaryColor,
  });

  const widgetUrl = `/booking/embed?${params.toString()}`;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'FADE_BOOKING_COMPLETE') {
        if (onBookingComplete) {
          onBookingComplete(event.data.bookingId);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onBookingComplete]);

  return (
    <div
      className="fade-embed-container relative overflow-hidden rounded-card border border-line shadow-lg"
      style={{ width, height }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken dark:bg-surface-raised z-10">
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: primaryColor, borderTopColor: 'transparent' }}
            />
            <span className="text-sm font-medium text-fg-secondary dark:text-fg-secondary">
              Loading FADE Booking Widget...
            </span>
          </div>
        </div>
      )}
      <iframe
        src={widgetUrl}
        title="FADE Booking Widget"
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        allow="payment"
      />
    </div>
  );
};
