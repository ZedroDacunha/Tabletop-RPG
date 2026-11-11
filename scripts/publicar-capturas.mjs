import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const run = process.env.GITHUB_RUN_ID || 'local';
const files = readdirSync('out').filter((f) => f.endsWith('.jpg')).sort();
const report = readdirSync('out')
  .filter((f) => f.startsWith('relatorio'))
  .map((f) => readFileSync(`out/${f}`, 'utf8'))
  .join('\n');
const SIZE = 42000;
const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' }).trim();

for (const file of files) {
  const base64 = readFileSync(`out/${file}`).toString('base64');
  const chunks = [];
  for (let i = 0; i < base64.length; i += SIZE) chunks.push(base64.slice(i, i + SIZE));
  writeFileSync('/tmp/corpo.txt', `<!-- parte 1/${chunks.length} -->\n\`\`\`\n${chunks[0]}\n\`\`\``);
  const url = gh(['issue', 'create', '--title', `CAPTURA ${run} ${file}`, '--body-file', '/tmp/corpo.txt']);
  for (let i = 1; i < chunks.length; i += 1) {
    writeFileSync('/tmp/corpo.txt', `<!-- parte ${i + 1}/${chunks.length} -->\n\`\`\`\n${chunks[i]}\n\`\`\``);
    gh(['issue', 'comment', url, '--body-file', '/tmp/corpo.txt']);
  }
  console.log(`publicado ${file} (${chunks.length} partes)`);
}
writeFileSync('/tmp/corpo.txt', `\`\`\`\n${report.slice(0, 60000)}\n\`\`\``);
gh(['issue', 'create', '--title', `RELATORIO ${run}`, '--body-file', '/tmp/corpo.txt']);
console.log('relatório publicado');
