const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm links workspace packages with symlinks. Metro's file map does not
// treat apps/mobile/node_modules/@fade as the package, so point at the
// real package directories.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@fade/design-tokens': path.join(workspaceRoot, 'packages/design-tokens'),
  '@fade/contracts': path.join(workspaceRoot, 'packages/contracts'),
};

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.watchFolders = [
  ...new Set([...(config.watchFolders ?? []), workspaceRoot]),
];

// Expo Router loads every file under src/app. Test files call jest.mock
// at import time, which crashes the browser bundle. Jest itself must still
// see those files, so the block applies only outside the test runner.
if (!process.env.JEST_WORKER_ID) {
  const testFiles = /\.test\.[jt]sx?$/;
  const blockList = config.resolver.blockList;
  config.resolver.blockList = Array.isArray(blockList)
    ? [...blockList, testFiles]
    : blockList
      ? [blockList, testFiles]
      : testFiles;
}

module.exports = config;
