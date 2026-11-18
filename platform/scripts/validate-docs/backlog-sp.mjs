// Backlog, part 2: StoryPoints — only top-level rows; parent
// task with slices = sum of slices (no double counting).

import { read } from './context.mjs';

// Row without file already reported above — don't read it to avoid ENOENT
const storyPoints = (row, taskFiles) => {
  if (!taskFiles.includes(row.slug)) return 0;
  const declared = read(`backlog/tasks/${row.slug}.md`).match(/\*\*StoryPoints\*\*:\s*(\d+)/);
  if (declared) return Number(declared[1]);
  // cells = [name, source, tags, complexity, status] — cell with ID already eaten by regex
  return { junior: 3, middle: 5, senior: 8 }[row.cells[3]] ?? 0;
};

export const computeStoryPoints = (rows, taskFiles) => {
  const top = rows.filter((r) => !r.slice);
  const slicesByParent = new Map();
  for (const row of rows.filter((r) => r.slice)) {
    if (!slicesByParent.has(row.cells[1])) slicesByParent.set(row.cells[1], []);
    slicesByParent.get(row.cells[1]).push(row);
  }
  const spByMilestone = new Map();
  let totalSp = 0;
  for (const row of top) {
    const children = slicesByParent.get(row.id) ?? [];
    const sp = children.length
      ? children.reduce((sum, c) => sum + storyPoints(c, taskFiles), 0)
      : storyPoints(row, taskFiles);
    totalSp += sp;
    spByMilestone.set(row.milestone, (spByMilestone.get(row.milestone) ?? 0) + sp);
  }
  return { top, spByMilestone, totalSp };
};
