// Pure decision logic for the dev supervisor (scripts/dev-watch.mjs).
//
// Kept dependency-free and side-effect-free so it can be unit tested with
// `node --test` (see dev-watch.test.mjs). The supervisor polls the build-status
// file that `webpack.config.js` writes on every finished rebuild and asks this
// function what to do.

/**
 * @typedef {{ handledAt: number | null, serverRunning: boolean }} WatchState
 * @typedef {{ ok: boolean, errors?: number, at: number } | null} BuildStatus
 */

/**
 * Decide the action for the current state and latest build status.
 *
 * Invariant behind the whole fix: a failed rebuild must never leave a server
 * running, and a server may only be (re)started off the back of a *successful*
 * rebuild. So:
 *   - status.ok  + server running     → restart (pick up the new bundle)
 *   - status.ok  + server not running → start
 *   - !status.ok + server running      → stop
 *   - !status.ok + server not running  → none (already safe)
 *   - no new status (same `at`)        → none
 *
 * @param {BuildStatus} status
 * @param {WatchState} state
 * @returns {'start' | 'restart' | 'stop' | 'none'}
 */
export function decide(status, state) {
  if (!status || typeof status.at !== 'number') return 'none';
  if (status.at === state.handledAt) return 'none';
  if (status.ok) {
    return state.serverRunning ? 'restart' : 'start';
  }
  return state.serverRunning ? 'stop' : 'none';
}

/**
 * Parse the raw status-file contents. Anything malformed is treated as "no
 * usable build" (null) so the supervisor never starts a server on bad input.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, errors?: number, at: number } | null}
 */
export function parseStatus(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.ok !== 'boolean' || typeof parsed?.at !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
