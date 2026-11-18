'use client';

// Блок дій картки візита (T-045): кнопки життєвого циклу за статусом,
// форма перенесення (T-4533), редактор коментаря (T-043 — поки booked/
// confirmed, далі 409 заклокований).
import { useState } from 'react';
import { Button } from '@fade/ui';
import RescheduleForm from './RescheduleForm';
import { ACTION_LABELS, type VisitAction } from './visit-status';

export default function VisitActions(props: {
  actions: VisitAction[];
  busy: boolean;
  post: (action: string, body: object) => Promise<boolean>;
}) {
  const { actions, busy, post } = props;
  const [openReschedule, setOpenReschedule] = useState(false);
  const [comment, setComment] = useState('');
  const canReschedule = actions.includes('reschedule');

  return (
    <>
      {actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {actions
            .filter(
              (action): action is Exclude<VisitAction, 'reschedule'> => action !== 'reschedule'
            )
            .map((action) => (
              <Button
                key={action}
                variant="secondary"
                size="md"
                disabled={busy}
                onClick={() => void post(action, {})}
              >
                {ACTION_LABELS[action]}
              </Button>
            ))}
          {canReschedule && (
            <Button
              variant="ghost"
              size="md"
              disabled={busy}
              onClick={() => setOpenReschedule(!openReschedule)}
            >
              Перенести
            </Button>
          )}
        </div>
      )}
      {openReschedule && (
        <RescheduleForm
          busy={busy}
          onSubmit={(value) =>
            void post('reschedule', value).then((ok) => ok && setOpenReschedule(false))
          }
        />
      )}
      {(actions.length > 0 || canReschedule) && (
        <div className="mt-3">
          <label className="block text-caption text-fg-muted">
            Коментар (до 500 символів)
            <textarea
              maxLength={500}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 block w-full rounded-input border border-line p-2"
            />
          </label>
          <Button
            variant="ghost"
            size="md"
            disabled={busy}
            onClick={() => void post('reference', { comment })}
          >
            Зберегти коментар
          </Button>
        </div>
      )}
    </>
  );
}
