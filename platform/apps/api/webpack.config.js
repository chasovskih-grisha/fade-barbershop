// Nest webpack config for @fade/api — defaults + a build-status emitter.
//
// WHY THIS FILE EXISTS
// `nest build --watch --webpack` (and `nest start --watch --webpack`) keep the
// *previous* bundle in `dist/` when a rebuild fails: webpack emits nothing on a
// bundle error, and Nest only restarts its child process when
// `stats.hasErrors()` is false. The result is a dev container that keeps
// serving a stale bundle after a broken change — the code in `src/` and the live
// responses diverge until someone restarts the container by hand.
//
// We don't patch Nest's watcher. Every finished rebuild writes
// `dist/.build-status.json` with `{ ok, errors, at }`, and the dev supervisor
// (`scripts/dev-watch.mjs`) owns the API process: it stops the server on a
// failed rebuild and only (re)starts it after a successful one.
//
// WHY NOT JUST `compiler.hooks.done` + `stats.hasErrors()`
// Because that lies in watch mode. Nest's default webpack config runs ts-loader
// with `transpileOnly: true` and delegates type checking to
// ForkTsCheckerWebpackPlugin, whose `done` tap is *asynchronous*: the bundle
// finishes, `done` fires, and only afterwards does the type-checker report. So a
// type error never reaches `stats.hasErrors()` here, and a naive plugin would
// write `ok: true` for a build that does not type-check. Instead we tap
// ForkTsChecker's own `issues` hook — the point where the authoritative
// type-check result (plus any bundle errors) is known — and record the status
// there. When ForkTsChecker is absent we fall back to `done`/`stats`.
//
// This only appends a plugin to Nest's own `webpackDefaultsFactory` output, so
// `nest build` keeps its exact behaviour (it uses tsc, not webpack, anyway) and
// the status file is a harmless extra artifact inside `dist/`.
const fs = require('fs');
const path = require('path');

const STATUS_FILENAME = '.build-status.json';

function writeStatus(compiler, { errors, source }) {
  const outDir = compiler.options?.output?.path;
  if (!outDir) return;
  try {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, STATUS_FILENAME),
      JSON.stringify({ ok: errors === 0, errors, source, at: Date.now() })
    );
  } catch {
    // Best-effort: a missing status file is read as "no usable build", which is
    // the safe direction — the supervisor will not start a server.
  }
}

class BuildStatusPlugin {
  apply(compiler) {
    const forkTsChecker = (compiler.options.plugins ?? []).find(
      (plugin) =>
        plugin && plugin.constructor && typeof plugin.constructor.getCompilerHooks === 'function'
    );

    if (forkTsChecker) {
      // `issues` is a SyncWaterfallHook, so the tap must return the list.
      const hooks = forkTsChecker.constructor.getCompilerHooks(compiler);
      hooks.issues.tap('FadeBuildStatusPlugin', (issues, compilation) => {
        const list = issues ?? [];
        const typeErrors = list.filter((issue) => issue?.severity === 'error').length;
        const bundleErrors = compilation?.errors?.length ?? 0;
        writeStatus(compiler, { errors: bundleErrors + typeErrors, source: 'issues' });
        return list;
      });
      return;
    }

    // Fallback: no ForkTsChecker → bundle errors are all we can see.
    compiler.hooks.done.tap('FadeBuildStatusPlugin', (stats) => {
      const errors = stats.hasErrors()
        ? stats.toJson({ errors: true, warnings: false }).errors.length
        : 0;
      writeStatus(compiler, { errors, source: 'done' });
    });
  }
}

// Nest calls a function export with (defaultOptions, webpack) and spreads the
// result over its defaults. Returning only `plugins` preserves every default
// (entry, ts-loader, TsconfigPathsPlugin, ForkTsChecker, nodeExternals, …).
module.exports = (defaultOptions) => ({
  plugins: [...(defaultOptions?.plugins ?? []), new BuildStatusPlugin()],
});
