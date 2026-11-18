'use client';

// Блок референсу зачіски в картці візиту (T-043, REF-WEB-03/04).
// API віддає лише referenceId, а фото лежить у приватному бакеті (ADR 0008 §2),
// тому підписаний URL береться окремим запитом — інакше мініатюра ніколи б
// не з’явилася (read-модель раніше віддавала порожній referenceUrl).
import Image from 'next/image';
import { Button } from '@fade/ui';
import type { ExtendedAppointment } from '@/lib/api/appointments';
import { useReferencePhotoUrl } from '../../booking/steps/useReferencePhotoUrl';

export function AppointmentReference({
  app,
  onEditReference,
}: {
  app: ExtendedAppointment;
  onEditReference: (app: ExtendedAppointment) => void;
}) {
  const signedUrl = useReferencePhotoUrl(app.referenceId);
  const editable = app.canEditReference;
  const visible = Boolean(signedUrl) || Boolean(app.referenceComment) || editable;

  if (!visible) return null;

  return (
    <div className="mt-2 border-t border-line pt-3">
      <p className="text-body-s text-fg-secondary mb-1">Референс зачіски</p>
      <div className="flex items-center gap-3">
        {signedUrl ? (
          <Image
            src={signedUrl}
            alt="Референс зачіски"
            width={64}
            height={64}
            unoptimized
            className="w-16 h-16 rounded-input object-cover"
          />
        ) : (
          <span className="text-body-s text-fg-secondary">
            {app.referenceId ? 'Фото недоступне' : 'Фото не прикріплене'}
          </span>
        )}
        {app.referenceComment ? (
          <p className="text-body-s text-fg flex-1">{app.referenceComment}</p>
        ) : null}
        {editable ? (
          <Button
            variant="ghost"
            size="md"
            onClick={() => onEditReference(app)}
            aria-label="Редагувати референс і коментар"
          >
            Редагувати
          </Button>
        ) : null}
      </div>
    </div>
  );
}
