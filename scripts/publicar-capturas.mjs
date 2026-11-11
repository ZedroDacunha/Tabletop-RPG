import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const run = process.env.GITHUB_RUN_ID || 'local';
const files = readdirSync('out').filter((f) => f.endsWith('.jpg')).sort();
const report = readdirSync('out')
  .filter((f) => f.startsWith('relatorio'))
  .map((f) => readFileSync(`out/${f}`, 'utf8'))
  .join('\n');
const SIZE = 42000;

function gh(args, body) {
  return execFileSync('gh', args, { input: body, encoding: 'utf8' }).trim();
}

for (const file of files) {
  const base64 = readFileSync(`out/${file}`).toString('base64');
  const chunks = [];
  for (let i = 0; i < base64.length; i += SIZE) chunks.push(base64.slice(i, i + SIZE));
  const title = `CAPTURA ${run} ${file}`;
  writeFileSync('/tmp/corpo.txt', `<!-- parte 1/${chunks.length} -->\n\`\`\`\n${chunks[0]}\n\`\`\``);
  const issueUrl = gh(['issue', 'create', '--title', title, '--body-file', '/tmp/corpo.txt']);
  for (let i = 1; i < chunks.length; i += 1) {
    writeFileSync('/tmp/corpo.txt', `<!-- parte ${i + 1}/${chunks.length} -->\n\`\`\`\n${chunks[i]}\n\`\`\``);
    gh(['issue', 'comment', issueUrl, '--body-file', '/tmp/corpo.txt']);
  }
  console.log(`publicado ${file} em ${issueUrl} (${chunks.length} partes)`);
}

writeFileSync('/tmp/relatorio.txt', report);
writeFileSync('/tmp/corpo.txt', `\`\`\`\n${report.slice(0, 60000)}\n\`\`\``);
const reportUrl = gh(['issue', 'create', '--title', `RELATORIO ${run}`, '--body-file', '/tmp/corpo.txt']);
console.log(`relatório em ${reportUrl}`);
