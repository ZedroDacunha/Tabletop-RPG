import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const run = process.env.GITHUB_RUN_ID || 'local';
const report = readdirSync('out')
  .filter((f) => f.startsWith('relatorio'))
  .map((f) => readFileSync(`out/${f}`, 'utf8'))
  .join('\n');
const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();
writeFileSync('/tmp/corpo.txt', `\`\`\`\n${report.slice(0, 60000)}\n\`\`\``);
console.log(gh(['issue', 'create', '--title', `RELATORIO ${run}`, '--body-file', '/tmp/corpo.txt']));
