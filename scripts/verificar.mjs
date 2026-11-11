import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';

const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const url = process.env.SITE_URL || 'http://127.0.0.1:8000/';
const shots = [];

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1280,800'],
});

async function shot(page, name) {
  const path = `out/${name}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 38, clip: { x: 0, y: 0, width: 1200, height: 720 } });
  shots.push(name);
}

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

let status = 'sem resposta';
try {
  const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  status = response ? String(response.status()) : status;
} catch (error) {
  logs.push(`[goto] ${error.message}`);
}
await new Promise((r) => setTimeout(r, 3500));

const entered = await page.evaluate(() => {
  const button = document.querySelector('.empty-world button');
  if (button instanceof HTMLElement) { button.click(); return true; }
  return false;
});
await new Promise((r) => setTimeout(r, 6000));
await shot(page, '1-mapa-entardecer');

const night = await page.evaluate(() => {
  const button = [...document.querySelectorAll('.light-options button')].find((b) => b.textContent?.includes('Noite'));
  if (button instanceof HTMLElement) { button.click(); return true; }
  return false;
});
await new Promise((r) => setTimeout(r, 3000));
await shot(page, '2-mapa-noite');

const day = await page.evaluate(() => {
  const button = [...document.querySelectorAll('.light-options button')].find((b) => b.textContent?.includes('Dia'));
  if (button instanceof HTMLElement) { button.click(); return true; }
  return false;
});
await new Promise((r) => setTimeout(r, 3000));
await shot(page, '3-mapa-dia');

const boundary = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.asset-card')];
  return items.slice(0, 12).map((i) => i.textContent?.trim());
});
await shot(page, '4-biblioteca');

const canvas = await page.evaluate(() => document.querySelectorAll('canvas').length);
const rootLength = await page.evaluate(() => document.getElementById('root')?.innerHTML.length ?? -1);
await browser.close();

writeFileSync('out/relatorio.txt', [
  `url: ${url}`,
  `status: ${status}`,
  `root: ${rootLength}`,
  `canvas: ${canvas}`,
  `mapa de exemplo aberto: ${entered}`,
  `noite: ${night} | dia: ${day}`,
  `biblioteca: ${JSON.stringify(boundary)}`,
  'capturas: ' + shots.join(', '),
  'logs:',
  ...logs.slice(0, 40),
].join('\n'));
console.log('capturas:', shots.join(', '));
