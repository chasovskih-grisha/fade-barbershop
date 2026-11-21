'use client';

import { useState } from 'react';
import { Card, Button, TextField, Badge, AlertBanner } from '@fade/ui';

export function CsatWidget() {
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');

  return (
    <Card className="p-6 md:p-8 bg-surface-base border border-line space-y-4">
      <div className="space-y-1">
        <Badge tone="success" className="mb-1">
          Контроль якості
        </Badge>
        <h3 className="font-display text-xl font-bold text-text-primary">
          Оцініть якість підтримки FADE
        </h3>
        <p className="text-xs text-text-muted">
          Нам важливо знати вашу думку. Як ви оцінюєте роботу служби підтримки та консьєрж-сервісу?
        </p>
      </div>

      {submitted ? (
        <AlertBanner tone="success" title="Дякуємо за вашу оцінку!">
          Ваш відгук та коментар успішно збережено. Це допомагає нам робити сервіс FADE досконалим.
        </AlertBanner>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-10 h-10 rounded-full border text-sm font-semibold transition-colors flex items-center justify-center ${
                    rating && rating >= star
                      ? 'bg-accent text-accent-fg border-action-primary'
                      : 'bg-surface-sunken border-line text-text-primary hover:border-action-primary'
                  }`}
                >
                  {star}★
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              disabled={!rating}
              onClick={() => {
                if (rating) setSubmitted(true);
              }}
              className="text-xs px-6 py-2.5"
            >
              Надіслати відгук 🌟
            </Button>
          </div>
          {rating && rating <= 4 && (
            <div className="pt-2">
              <TextField
                id="csat-feedback-text"
                label="Що саме ми можемо покращити?"
                placeholder="Розкажіть детальніше про ваш досвід..."
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="bg-surface-sunken"
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
