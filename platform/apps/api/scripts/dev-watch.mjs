#!/usr/bin/env node
// Dev supervisor for @fade/api that closes the Nest hot-reload gap.
//
// THE BUG
// `nest start --watch --webpack` restarts its API child process only when a
// rebuild *succeeds*. When a rebuild fails, webpack emits nothing, Nest logs the
// errors and leaves the previous process running — so the container keeps
// serving the last good bundle while `src/` holds broken code. A transient TS
// error silently "sticks" until someone restarts the container by hand.
//
// THE FIX
// This process owns both halves:
//   1. a builder child: `nest build --watch --webpack` (unchanged compilation);
//   2. the API server child: `node --enable-source-maps dist/main.js`.
//
// `webpack.config.js` writes `dist/.build-status.json` on every finished
// rebuild. We poll it and:
//   - on a *failed* rebuild → stop the server (nothing stale can be served);
//   - on a *successful* rebuild → (re)start the server on the fresh bundle.
// See scripts/dev-watch-lib.mjs for the (unit-tested) decision table.
//
// A build that is merely in flight is not treated as failed: the old bundle
// remains the last known-good one until webpack reports the outcome.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, parseStatus } from './dev-watch-lib.mjs';

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = path.join(API_DIR, 'dist');
const STATUS_PATH = path.join(DIST_DIR, '.build-status.json');
const POLL_MS = 250;
const KILL_GRACE_MS = 5000;

const log = (message) => console.log(`[dev-watch] ${message}`);

/** Nest writes to dist/main.js for this app; dist/src/main.js is the fallback. */
function resolveEntry() {
  for (const candidate of ['main.js', path.join('src', 'main.js')]) {
    const full = path.join(DIST_DIR, candidate);
    if (existsSync(full)) return full;
  }
  return null;
}

function resolveNestBin() {
  const local = path.join(API_DIR, 'node_modules', '.bin', 'nest');
  return existsSync(local)
    ? { command: local, args: [] }
    : { command: 'pnpm', args: ['exec', 'nest'] };
}

function readStatus() {
  try {
    return parseStatus(readFileSync(STATUS_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/** @type {import('node:child_process').ChildProcess | null} */
let server = null;
/** @type {import('node:child_process').ChildProcess | null} */
let builder = null;
let handledAt = null;
let applying = false;
let shuttingDown = false;

function spawnServer() {
  const entry = resolveEntry();
  if (!entry) {
    log('build reported ok but dist/main.js is missing — not starting a server');
    return;
  }
  server = spawn(process.execPath, ['--enable-source-maps', entry], {
    cwd: API_DIR,
    stdio: 'inherit',
    env: process.env,
  });
  server.on('exit', (code, signal) => {
    const expected = shuttingDown;
    server = null;
    if (!expected) {
      log(`api server exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
    }
  });
  log(`api server started (pid ${server.pid})`);
}

function stopServer() {
  return new Promise((resolve) => {
    const current = server;
    if (!current) return resolve();
    const pid = current.pid;
    log(`stopping api server (pid ${pid})`);
    const force = setTimeout(() => {
      if (server === current) current.kill('SIGKILL');
    }, KILL_GRACE_MS);
    current.once('exit', () => {
      clearTimeout(force);
      resolve();
    });
    current.kill('SIGTERM');
  });
}

async function apply() {
  if (applying || shuttingDown) return;
  applying = true;
  try {
    const status = readStatus();
    const action = decide(status, { handledAt, serverRunning: server !== null });
    if (action === 'none') return;
    handledAt = status.at;
    if (action === 'stop') {
      log(
        `build FAILED (${status.errors ?? 0} error${status.errors === 1 ? '' : 's'}) → api server stopped; no stale bundle will be served`
      );
      await stopServer();
      return;
    }
    // start | restart
    if (server) await stopServer();
    spawnServer();
    log('build ok → api server (re)started on the fresh bundle');
  } finally {
    applying = false;
  }
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`received ${signal}, shutting down`);
  if (builder) builder.kill('SIGTERM');
  if (server) server.kill('SIGTERM');
  // Give children a moment to exit, then hard-exit so the container stops.
  setTimeout(() => {
    if (builder) builder.kill('SIGKILL');
    if (server) server.kill('SIGKILL');
    process.exit(0);
  }, 1000).unref();
}

const nest = resolveNestBin();
log(
  `starting builder: ${nest.command} ${[...nest.args, 'build', '--watch', '--webpack'].join(' ')}`
);
builder = spawn(nest.command, [...nest.args, 'build', '--watch', '--webpack'], {
  cwd: API_DIR,
  stdio: 'inherit',
  env: process.env,
});
builder.on('exit', (code, signal) => {
  builder = null;
  if (shuttingDown) return;
  log(
    `builder exited unexpectedly (code=${code ?? 'null'}, signal=${signal ?? 'null'}) → stopping api server`
  );
  // A dead builder can no longer prove a fresh bundle; fail closed.
  void stopServer().then(() => process.exit(code ?? 1));
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const timer = setInterval(() => void apply(), POLL_MS);
timer.unref?.();
// Kick off immediately in case a status file already exists (warm restart).
void apply();
