import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';

async function checar(nome, url) {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
  let status = 'sem resposta';
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    status = resp ? resp.status() : status;
  } catch (e) {
    logs.push(`[goto] ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 6000));
  const rootLen = await page.evaluate(() => document.getElementById('root')?.innerHTML.length ?? -1);
  const texto = (await page.evaluate(() => document.body.innerText || '')).slice(0, 400);
  const canvas = await page.evaluate(() => document.querySelectorAll('canvas').length);
  await page.screenshot({ path: `out/${nome}.png` });
  await browser.close();
  return { nome, url, status, rootLen, canvas, texto, logs: logs.slice(0, 30) };
}

const resultados = [];
resultados.push(await checar('local', 'http://127.0.0.1:8000/'));
resultados.push(await checar('publicado', 'https://zedrodacunha.github.io/Tabletop-RPG/'));

writeFileSync('out/relatorio.txt', resultados.map((r) => [
  `== ${r.nome} (${r.url}) ==`,
  `status: ${r.status}`,
  `#root tamanho: ${r.rootLen}`,
  `canvas: ${r.canvas}`,
  `texto: ${JSON.stringify(r.texto)}`,
  'logs:',
  ...r.logs,
  '',
].join('\n')).join('\n'));
console.log('ok');
