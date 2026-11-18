#!/usr/bin/env node
// Documentation validator (CI gate): traceability, phantom quotes, DoD ↔ roadmap.
// Run: node scripts/validate-docs.mjs · exit 0 = ok, 1 = errors.
// Rules derived from revisions 2026-09-23 (see backlog journal).
// Checks live in scripts/validate-docs/ — one rule per module.

import { collectMdFiles } from './validate-docs/collect-md.mjs';
import { checkAdrCitations } from './validate-docs/check-adr.mjs';
import { checkDocsRefs } from './validate-docs/check-docs-refs.mjs';
import { checkTraceability } from './validate-docs/check-traceability.mjs';
import { checkDodRoadmap } from './validate-docs/check-dod.mjs';
import { checkBacklog } from './validate-docs/check-backlog.mjs';
import { errors } from './validate-docs/context.mjs';

const mdFiles = collectMdFiles();
checkAdrCitations(mdFiles);
checkDocsRefs(mdFiles);
const acGroups = checkTraceability();
const dodSections = checkDodRoadmap();
const { count: tasks, totalSp } = checkBacklog();

// ── Report ──
const checks = mdFiles.length + acGroups + dodSections + tasks;
if (errors.length) {
  console.error(`✖ ${errors.length} errors (checked ${checks} units):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✔ Documentation valid: ${mdFiles.length} md-files, ${acGroups} AC-groups, ` +
    `${dodSections} DoD sections, ${tasks} backlog tasks (${totalSp} SP).`
);
