// Shared context of documentation validator: project root, file reading
// and error accumulator. Single import for all checks.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readFromDisk = (p) => readFileSync(join(projectRoot, p), 'utf8');

export let root = projectRoot;
export let read = readFromDisk;
export const errors = [];
export const fail = (msg) => errors.push(msg);

/** Тест-режим: корінь = тимчасове дерево фікстур, read читає з нього. */
export const useTestRoot = (dir) => {
  root = dir;
  read = (p) => readFileSync(join(dir, p), 'utf8');
};

export const resetContext = () => {
  root = projectRoot;
  read = readFromDisk;
  errors.length = 0;
};
