'use client';

import { Button } from '@fade/ui';
import { patternLabel, rewardView, statusView } from './referral-labels';
import type { ReferralItem } from './referral-model';

export default function ReferralRow({
  item,
  onRevoke,
}: {
  item: ReferralItem;
  onRevoke: (item: ReferralItem) => void;
}) {
  const status = statusView(item.status);
  const reward = rewardView(item.rewardStatus);
  return (
    <tr className="border-b border-border hover:bg-surface-raised/50">
      <td className="py-3 px-4">
        <div className="font-medium text-fg">{item.friendName}</div>
        <div className="text-body-sm text-fg-secondary">{item.friendPhone}</div>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-fg">{item.referrerName}</div>
        <div className="text-body-sm text-fg-secondary">{item.referrerPhone}</div>
      </td>
      <td className="py-3 px-4 text-fg-secondary">{item.locationName}</td>
      <td className="py-3 px-4 text-fg-secondary">{item.registrationDate}</td>
      <td className="py-3 px-4">
        <span
          className={`inline-block rounded-pill px-2.5 py-1 text-body-sm font-medium ${status.tone}`}
        >
          {status.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-fg">{item.rewardAmount}</div>
        <span className={`text-body-sm ${reward.tone}`}>{reward.label}</span>
      </td>
      <td className="py-3 px-4">
        {item.suspiciousPattern ? (
          <span className="inline-block rounded-pill bg-semantic-warning/10 px-2.5 py-1 text-body-sm font-medium text-semantic-warning">
            {patternLabel(item.suspiciousPattern)}
          </span>
        ) : (
          <span className="text-fg-secondary text-body-sm">—</span>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        {item.rewardStatus !== 'revoked' ? (
          <Button variant="secondary" onClick={() => onRevoke(item)}>
            Анулювати
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
