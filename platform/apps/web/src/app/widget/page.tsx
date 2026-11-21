'use client';

import React, { useEffect, useState } from 'react';

export default function EmbeddableWidgetPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [color, setColor] = useState('var(--color-lightTheme-ink)');
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('theme');
    if (t === 'dark' || t === 'light') setTheme(t);
    const c = params.get('color');
    if (c) setColor(c);
    const s = params.get('serviceId');
    if (s) setServiceId(s);

    // Notify parent frame that widget is ready
    window.parent.postMessage({ type: 'FADE_WIDGET_READY' }, '*');
  }, []);

  const handleBook = () => {
    window.parent.postMessage({ type: 'FADE_WIDGET_BOOK', serviceId }, '*');
  };

  return (
    <div
      className={`min-h-screen p-4 flex flex-col justify-between ${theme === 'dark' ? 'bg-surface-base text-white' : 'bg-white text-fg'}`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-h4 font-bold">FADE Quick Booking</h1>
          <span className="text-xs px-2 py-1 rounded bg-interactive dark:bg-surface-raised">
            Widget v1
          </span>
        </div>
        <p className="text-sm mb-4 text-fg-secondary dark:text-fg-muted">
          Book your premium haircut instantly via FADE widget.
        </p>
        <div className="space-y-3">
          <div className="p-3 border rounded-lg dark:border-line flex justify-between items-center">
            <div>
              <div className="font-semibold text-sm">Classic Fade & Beard Trim</div>
              <div className="text-xs text-fg-muted">45 min • 650 UAH</div>
            </div>
            <button
              onClick={handleBook}
              style={{ backgroundColor: color }}
              className="text-white text-xs px-3 py-1.5 rounded font-medium hover:opacity-90 transition-opacity"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-fg-muted pt-4 border-t dark:border-line">
        Powered by FADE Platform
      </div>
    </div>
  );
}
