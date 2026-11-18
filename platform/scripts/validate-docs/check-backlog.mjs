// Check 5: backlog — index/*.md ↔ tasks/ in both directions, statuses,
// SP-aggregates of stages and the README summary verified against the index.

import { parseBacklogIndex } from './backlog-index.mjs';
import { computeStoryPoints } from './backlog-sp.mjs';
import { checkBacklogSummary } from './backlog-summary.mjs';

export const checkBacklog = () => {
  const { rows, taskFiles } = parseBacklogIndex();
  const { top, spByMilestone, totalSp } = computeStoryPoints(rows, taskFiles);
  checkBacklogSummary({ rows, top, spByMilestone, totalSp });
  return { count: rows.length, totalSp };
};
