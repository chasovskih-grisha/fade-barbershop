import fs from 'node:fs';

export function validateCommitMessage(message) {
  const conventionalRegex = /^(feat|fix|docs|refactor|test|chore|perf|ci|build|style)(\(.+\))?!?: .+$/;
  return conventionalRegex.test(message.trim().split('\n')[0]);
}

if (process.argv[2]) {
  const commitMsgFile = process.argv[2];
  if (fs.existsSync(commitMsgFile)) {
    const msg = fs.readFileSync(commitMsgFile, 'utf8');
    if (!validateCommitMessage(msg)) {
      console.error('Error: Commit message does not follow Conventional Commits format (e.g., feat(scope): description, fix: ...)');
      process.exit(1);
    }
  }
}
