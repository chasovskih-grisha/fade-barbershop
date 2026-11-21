import { execSync } from 'node:child_process';
import fs from 'node:fs';

export function generateChangelogContent() {
  try {
    const logs = execSync('git log --oneline -n 50', { encoding: 'utf8' });
    let changelog =
      '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## Recent Commits\n\n';
    for (const line of logs.trim().split('\n')) {
      if (line) {
        changelog += `- ${line}\n`;
      }
    }
    return changelog;
  } catch (err) {
    return '# Changelog\n\n- Initial release\n';
  }
}

const content = generateChangelogContent();
fs.writeFileSync('CHANGELOG.md', content, 'utf8');
console.log('CHANGELOG.md generated successfully.');
