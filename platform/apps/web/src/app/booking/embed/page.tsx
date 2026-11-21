'use client';

import React, { useState } from 'react';

export default function EmbedBookingPage() {
  const [step, setStep] = useState(1);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleComplete = () => {
    const fakeBookingId = 'bk-' + Math.random().toString(36).substring(2, 9);
    setBookingId(fakeBookingId);
    setStep(3);

    // Notify parent window via postMessage
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'FADE_BOOKING_COMPLETE',
          bookingId: fakeBookingId,
        },
        '*'
      );
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-surface-raised rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-fg dark:text-white">Quick Booking Widget</h2>
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-fg-secondary dark:text-fg-secondary">
            Select service and barber to proceed.
          </p>
          <button
            onClick={() => setStep(2)}
            className="w-full py-2 px-4 bg-black text-white rounded-md font-medium hover:bg-interactive-hover transition"
          >
            Select Slot & Continue
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-fg-secondary dark:text-fg-secondary">
            Confirm slot: Today at 15:00
          </p>
          <button
            onClick={handleComplete}
            className="w-full py-2 px-4 bg-semantic-success text-white rounded-md font-medium hover:bg-interactive-hover transition"
          >
            Confirm & Book
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="text-semantic-success font-bold text-h4">Booking Confirmed!</div>
          <p className="text-xs text-fg-muted">ID: {bookingId}</p>
        </div>
      )}
    </div>
  );
}
